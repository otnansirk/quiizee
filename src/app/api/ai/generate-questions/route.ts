import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const generateQuestionsSchema = z.object({
  referenceText: z.string().optional(),
  questionCount: z.number().optional().default(5),
  questionTypes: z.array(z.string()).optional().default(['multiple_choice', 'true_false', 'essay']),
  difficulty: z.string().optional().default('medium'),
});

const AI_API_KEY = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
const AI_API_URL: string =
  process.env.AI_API_URL ||
  process.env.GEMINI_API_URL ||
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function POST(req: Request) {
  try {
    // Auth: only teachers
    const session = await auth();
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!AI_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'AI service is not configured. Please set AI_API_KEY in your environment.' },
        { status: 503 }
      );
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = generateQuestionsSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body', errors: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const body = parseResult.data;
    const {
      referenceText,
      questionCount = 5,
      questionTypes = ['multiple_choice', 'true_false', 'essay'],
      difficulty = 'medium',
    } = body;

    const allowedTypes = questionTypes.filter((t) => ['multiple_choice', 'true_false', 'essay'].includes(t));
    const finalAllowedTypes = allowedTypes.length > 0 ? allowedTypes : ['multiple_choice', 'true_false', 'essay'];

    if (!referenceText || typeof referenceText !== 'string' || referenceText.trim().length < 20) {
      return NextResponse.json(
        { success: false, message: 'Reference text must be at least 20 characters.' },
        { status: 400 }
      );
    }

    if (questionCount < 1 || questionCount > 20) {
      return NextResponse.json(
        { success: false, message: 'Question count must be between 1 and 20.' },
        { status: 400 }
      );
    }

    // Build type breakdown instruction
    const typeList = finalAllowedTypes.join(', ');

    const prompt = `You are an expert educational assessment designer. Based on the reference material below, generate exactly ${questionCount} quiz questions.

REFERENCE MATERIAL:
"""
${referenceText.trim()}
"""

REQUIREMENTS:
- Generate exactly ${questionCount} questions
- Use only these question types: ${typeList}
- STRICTLY DO NOT generate any question types outside of: ${typeList}
- Difficulty level: ${difficulty}
- Questions must be directly based on the reference material
- For multiple_choice: provide exactly 4 options, with exactly 1 correct answer
- For true_false: the answer must be either "true" or "false"
- For essay: provide a model answer as correctAnswer
- Points should be: multiple_choice = 1, true_false = 1, essay = 3

RESPOND WITH ONLY VALID JSON — no markdown, no explanation, no code fences. Use this exact structure:
{
  "questions": [
    {
      "type": "multiple_choice",
      "questionText": "...",
      "points": 1,
      "correctAnswer": null,
      "options": [
        { "optionText": "...", "isCorrect": true },
        { "optionText": "...", "isCorrect": false },
        { "optionText": "...", "isCorrect": false },
        { "optionText": "...", "isCorrect": false }
      ]
    },
    {
      "type": "true_false",
      "questionText": "...",
      "points": 1,
      "correctAnswer": "true",
      "options": []
    },
    {
      "type": "essay",
      "questionText": "...",
      "points": 3,
      "correctAnswer": "Model answer: ...",
      "options": []
    }
  ]
}`;

    const AI_MODEL = process.env.AI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    const isRouterV1 =
      AI_API_URL.includes('/chat/completions') ||
      (AI_API_URL.includes('/v1') &&
        !AI_API_URL.includes('googleapis.com') &&
        !AI_API_URL.includes(':generateContent'));

    let targetUrl: string = AI_API_URL;
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let requestBody: any;

    if (isRouterV1) {
      // 9router / OpenAI / OneAPI format
      targetUrl = AI_API_URL.endsWith('/v1') || AI_API_URL.endsWith('/v1/')
        ? AI_API_URL.replace(/\/$/, '') + '/chat/completions'
        : AI_API_URL;
      headers['Authorization'] = `Bearer ${AI_API_KEY}`;
      requestBody = {
        model: AI_MODEL,
        stream: false,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      };
    } else {
      // Google Gemini Native format
      targetUrl = `${AI_API_URL}?key=${AI_API_KEY}`;
      requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      };
    }

    const geminiRes = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error('Gemini API error:', errBody);
      return NextResponse.json(
        { success: false, message: 'AI service returned an error. Check your API key and quota.' },
        { status: 502 }
      );
    }

    const responseText = await geminiRes.text();
    let rawText: string = '';

    // Check if provider returned Server-Sent Events (SSE / Streamed chunks)
    if (responseText.includes('data: ') && (responseText.includes('"chat.completion.chunk"') || responseText.includes('"delta"'))) {
      const lines = responseText.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6).trim();
          if (jsonStr === '[DONE]' || !jsonStr) continue;
          try {
            const parsedChunk = JSON.parse(jsonStr);
            const deltaContent =
              parsedChunk?.choices?.[0]?.delta?.content ||
              parsedChunk?.choices?.[0]?.message?.content ||
              '';
            if (deltaContent) {
              rawText += deltaContent;
            }
          } catch {
            // Ignore partial or unparseable chunk lines
          }
        }
      }
    } else {
      // Normal non-streamed response
      const cleanResponseText = responseText.replace(/data:\s*\[DONE\]/gi, '').trim();
      let geminiData: any = {};
      try {
        geminiData = JSON.parse(cleanResponseText);
      } catch (e) {
        const firstBrace = cleanResponseText.indexOf('{');
        const lastBrace = cleanResponseText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          try {
            geminiData = JSON.parse(cleanResponseText.substring(firstBrace, lastBrace + 1));
          } catch {
            console.error("Failed to parse JSON response after extraction:", cleanResponseText);
          }
        } else {
          console.error("Failed to parse JSON response:", cleanResponseText);
        }
      }

      rawText =
        geminiData?.choices?.[0]?.message?.content ||
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
        '';
    }

    if (!rawText) {
      return NextResponse.json(
        { success: false, message: 'AI returned an empty response. Please try again.' },
        { status: 502 }
      );
    }

    // Extract top-level JSON structure without breaking nested markdown code blocks inside questionText
    let cleaned = rawText.trim();
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let firstIndex = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
      firstIndex = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
      firstIndex = firstBrace;
    } else {
      firstIndex = firstBracket;
    }

    if (firstIndex !== -1) {
      const lastBrace = cleaned.lastIndexOf('}');
      const lastBracket = cleaned.lastIndexOf(']');
      const lastIndex = Math.max(lastBrace, lastBracket);
      if (lastIndex > firstIndex) {
        cleaned = cleaned.substring(firstIndex, lastIndex + 1);
      }
    }

    let parsed: { questions: unknown[] };
    try {
      const jsonObj = JSON.parse(cleaned);
      if (Array.isArray(jsonObj)) {
        parsed = { questions: jsonObj };
      } else if (jsonObj && Array.isArray(jsonObj.questions)) {
        parsed = jsonObj;
      } else if (jsonObj && typeof jsonObj === 'object') {
        const arrProp = Object.values(jsonObj).find((val) => Array.isArray(val));
        parsed = { questions: Array.isArray(arrProp) ? arrProp : [] };
      } else {
        parsed = { questions: [] };
      }
    } catch {
      console.error('Failed to parse Gemini JSON:', cleaned);
      return NextResponse.json(
        { success: false, message: 'AI returned malformed data. Please try again.' },
        { status: 502 }
      );
    }

    if (!Array.isArray(parsed?.questions) || parsed.questions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'AI did not return any questions. Try rephrasing your reference text.' },
        { status: 502 }
      );
    }

    // Sanitize and normalise each question across different model schemas
    let questions = parsed.questions.map((q: any, idx: number) => {
      const qText = String(q.questionText || q.question || q.prompt || '').trim();
      const ans = q.correctAnswer != null ? String(q.correctAnswer) : q.answer != null ? String(q.answer) : null;
      let type = ['multiple_choice', 'true_false', 'essay'].includes(q.type) ? q.type : 'multiple_choice';

      const options = Array.isArray(q.options)
        ? q.options.map((opt: any, oidx: number) => {
            if (typeof opt === 'string') {
              const optStr = opt.trim();
              const isCorr = ans ? optStr.toLowerCase() === ans.toLowerCase() : oidx === 0;
              return { optionText: optStr, isCorrect: isCorr, order: oidx + 1 };
            }
            return {
              optionText: String(opt.optionText || opt.text || opt.label || '').trim(),
              isCorrect: Boolean(opt.isCorrect || (ans && String(opt.optionText || opt.text || '').trim().toLowerCase() === ans.toLowerCase())),
              order: oidx + 1,
            };
          })
        : [];

      // If model returned a type not requested by teacher (e.g. 'essay' when essay deselected)
      if (!finalAllowedTypes.includes(type)) {
        if (options.length > 1 && finalAllowedTypes.includes('multiple_choice')) {
          type = 'multiple_choice';
        } else if (options.length === 2 && finalAllowedTypes.includes('true_false')) {
          type = 'true_false';
        }
      }

      return {
        type,
        questionText: qText,
        points: Number(q.points) > 0 ? Number(q.points) : (type === 'essay' ? 3 : 1),
        correctAnswer: ans,
        order: idx + 1,
        options,
      };
    });

    // Strictly filter out any question whose type is still outside finalAllowedTypes
    questions = questions
      .filter((q: any) => finalAllowedTypes.includes(q.type))
      .map((q: any, idx: number) => ({ ...q, order: idx + 1 }));

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    console.error('Error in generate-questions API:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

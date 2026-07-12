import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const generateQuestionsSchema = z.object({
  referenceText: z.string().optional(),
  questionCount: z.number().optional().default(5),
  questionTypes: z.array(z.string()).optional().default(['multiple_choice', 'true_false', 'essay']),
  difficulty: z.string().optional().default('medium'),
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL: string =
  process.env.GEMINI_API_URL ||
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function POST(req: Request) {
  try {
    // Auth: only teachers
    const session = await auth();
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'AI service is not configured. Please set GEMINI_API_KEY in your environment.' },
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
    const typeList = (questionTypes as string[])
      .filter((t) => ['multiple_choice', 'true_false', 'essay'].includes(t))
      .join(', ');

    const prompt = `You are an expert educational assessment designer. Based on the reference material below, generate exactly ${questionCount} quiz questions.

REFERENCE MATERIAL:
"""
${referenceText.trim()}
"""

REQUIREMENTS:
- Generate exactly ${questionCount} questions
- Use only these question types: ${typeList}
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

    const isRouterV1 =
      GEMINI_API_URL.includes('/chat/completions') ||
      (GEMINI_API_URL.includes('/v1') &&
        !GEMINI_API_URL.includes('googleapis.com') &&
        !GEMINI_API_URL.includes(':generateContent'));

    let targetUrl: string = GEMINI_API_URL;
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let requestBody: any;

    if (isRouterV1) {
      // 9router / OpenAI / OneAPI format
      targetUrl = GEMINI_API_URL.endsWith('/v1') || GEMINI_API_URL.endsWith('/v1/')
        ? GEMINI_API_URL.replace(/\/$/, '') + '/chat/completions'
        : GEMINI_API_URL;
      headers['Authorization'] = `Bearer ${GEMINI_API_KEY}`;
      requestBody = {
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      };
    } else {
      // Google Gemini Native format
      targetUrl = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
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

    const geminiData = (await geminiRes.json()) as any;
    const rawText: string =
      geminiData?.choices?.[0]?.message?.content ||
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      '';

    if (!rawText) {
      return NextResponse.json(
        { success: false, message: 'AI returned an empty response. Please try again.' },
        { status: 502 }
      );
    }

    // Strip potential markdown code fences
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let parsed: { questions: unknown[] };
    try {
      parsed = JSON.parse(cleaned);
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

    // Sanitize and normalise each question
    const questions = parsed.questions.map((q: any, idx: number) => ({
      type: ['multiple_choice', 'true_false', 'essay'].includes(q.type) ? q.type : 'multiple_choice',
      questionText: String(q.questionText || '').trim(),
      points: Number(q.points) > 0 ? Number(q.points) : 1,
      correctAnswer: q.correctAnswer != null ? String(q.correctAnswer) : null,
      order: idx + 1,
      options: Array.isArray(q.options)
        ? q.options.map((opt: any, oidx: number) => ({
            optionText: String(opt.optionText || '').trim(),
            isCorrect: Boolean(opt.isCorrect),
            order: oidx + 1,
          }))
        : [],
    }));

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    console.error('Error in generate-questions API:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

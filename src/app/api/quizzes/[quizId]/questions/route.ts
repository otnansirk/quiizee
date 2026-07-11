import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';

const optionInputSchema = z.object({
  optionText: z.string().optional(),
  isCorrect: z.boolean().optional(),
  order: z.number().optional(),
});

const createQuestionSchema = z.object({
  type: z.string().optional(),
  questionText: z.string().optional(),
  questionImage: z.string().nullable().optional(),
  duration: z.union([z.number(), z.string()]).nullable().optional(),
  points: z.union([z.number(), z.string()]).nullable().optional(),
  order: z.union([z.number(), z.string()]).optional(),
  correctAnswer: z.string().nullable().optional(),
  options: z.array(optionInputSchema).optional(),
});

interface RouteContext {
  params: Promise<{
    quizId: string;
  }>;
}

interface OptionInput {
  optionText?: string;
  isCorrect?: boolean;
  order?: number;
}

async function checkTeacherAndQuiz(quizId: string) {
  const db = getDb();
  const session = await auth();
  if (!session?.user || session.user.role !== 'teacher') {
    return {
      error: NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  const [quiz] = await db
    .select()
    .from(schema.quizzes)
    .where(eq(schema.quizzes.id, quizId))
    .limit(1);

  if (!quiz) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Quiz not found' },
        { status: 404 }
      ),
    };
  }

  if (quiz.teacherId !== session.user.id) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      ),
    };
  }

  return { session, quiz };
}

export async function GET(req: Request, { params }: RouteContext) {
  const db = getDb();
  try {
    const { quizId } = await params;
    const { error, quiz } = await checkTeacherAndQuiz(quizId);
    if (error) return error;
    if (!quiz) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    const quizQuestions = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.quizId, quizId))
      .orderBy(asc(schema.questions.order));

    const questionsWithOptions = await Promise.all(
      quizQuestions.map(async (question) => {
        const options = await db
          .select()
          .from(schema.questionOptions)
          .where(eq(schema.questionOptions.questionId, question.id))
          .orderBy(asc(schema.questionOptions.order));

        return {
          ...question,
          options,
        };
      })
    );

    return NextResponse.json(questionsWithOptions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while fetching questions' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: RouteContext) {
  const db = getDb();
  try {
    const { quizId } = await params;
    const { error, quiz } = await checkTeacherAndQuiz(quizId);
    if (error) return error;
    if (!quiz) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = createQuestionSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body', errors: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const {
      type,
      questionText,
      questionImage,
      duration,
      points,
      order,
      correctAnswer,
      options,
    } = parseResult.data;

    if (!type || !questionText) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: type or questionText' },
        { status: 400 }
      );
    }

    const validTypes = ['multiple_choice', 'true_false', 'essay'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid question type. Must be 'multiple_choice', 'true_false', or 'essay'." },
        { status: 400 }
      );
    }

    if (type === 'multiple_choice' && (!Array.isArray(options) || options.length === 0)) {
      return NextResponse.json(
        { success: false, message: 'Multiple choice questions must include an options array.' },
        { status: 400 }
      );
    }

    let questionOrder = order;
    if (questionOrder === undefined || questionOrder === null) {
      const existingQuestions = await db
        .select({ id: schema.questions.id })
        .from(schema.questions)
        .where(eq(schema.questions.quizId, quizId));
      questionOrder = existingQuestions.length + 1;
    }

    const createdQuestionWithOptions = await db.transaction(async (tx) => {
      const [newQuestion] = await tx
        .insert(schema.questions)
        .values({
          quizId,
          type: type as 'multiple_choice' | 'true_false' | 'essay',
          questionText: questionText.trim(),
          questionImage: questionImage ? questionImage.trim() : null,
          duration: duration !== undefined && duration !== null ? Number(duration) : null,
          points: points !== undefined && points !== null ? Number(points) : 1,
          order: Number(questionOrder),
          correctAnswer:
            correctAnswer !== undefined && correctAnswer !== null
              ? String(correctAnswer)
              : type === 'multiple_choice' && Array.isArray(options)
              ? String((options as OptionInput[]).find((o) => o.isCorrect)?.optionText || '').trim() || null
              : null,
        })
        .returning();

      let insertedOptions: schema.QuestionOption[] = [];
      if (type === 'multiple_choice' && Array.isArray(options) && options.length > 0) {
        const optionsToInsert = (options as OptionInput[]).map((opt, idx) => ({
          questionId: newQuestion.id,
          optionText: String(opt.optionText || '').trim(),
          isCorrect: Boolean(opt.isCorrect),
          order: opt.order !== undefined && opt.order !== null ? Number(opt.order) : idx + 1,
        }));

        insertedOptions = await tx
          .insert(schema.questionOptions)
          .values(optionsToInsert)
          .returning();
      }

      return {
        ...newQuestion,
        options: insertedOptions,
      };
    });

    return NextResponse.json(createdQuestionWithOptions, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while creating the question' },
      { status: 500 }
    );
  }
}

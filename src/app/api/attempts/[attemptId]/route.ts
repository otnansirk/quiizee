import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    attemptId: string;
  }>;
}

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const { attemptId } = await params;

    if (!attemptId) {
      return NextResponse.json(
        { success: false, message: 'attemptId is required' },
        { status: 400 }
      );
    }

    let [attempt] = await db
      .select()
      .from(schema.quizAttempts)
      .where(eq(schema.quizAttempts.id, attemptId))
      .limit(1);

    if (!attempt) {
      // Small delay and retry to allow newly committed transaction from join API to sync across connections/pool
      await new Promise((resolve) => setTimeout(resolve, 200));
      [attempt] = await db
        .select()
        .from(schema.quizAttempts)
        .where(eq(schema.quizAttempts.id, attemptId))
        .limit(1);
    }

    if (!attempt) {
      return NextResponse.json(
        { success: false, message: 'Attempt not found' },
        { status: 404 }
      );
    }

    const [quiz] = await db
      .select()
      .from(schema.quizzes)
      .where(eq(schema.quizzes.id, attempt.quizId))
      .limit(1);

    if (!quiz) {
      return NextResponse.json(
        { success: false, message: 'Quiz not found' },
        { status: 404 }
      );
    }

    const quizQuestions = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.quizId, quiz.id))
      .orderBy(asc(schema.questions.order));

    const sanitizedQuestions = await Promise.all(
      quizQuestions.map(async (question) => {
        const options = await db
          .select()
          .from(schema.questionOptions)
          .where(eq(schema.questionOptions.questionId, question.id))
          .orderBy(asc(schema.questionOptions.order));

        const sanitizedOptions = options.map((opt) => ({
          id: opt.id,
          questionId: opt.questionId,
          optionText: opt.optionText,
          order: opt.order,
        }));

        return {
          id: question.id,
          quizId: question.quizId,
          type: question.type,
          questionText: question.questionText,
          questionImage: question.questionImage,
          duration: question.duration,
          points: question.points,
          order: question.order,
          options: sanitizedOptions,
        };
      })
    );

    const studentAnswers = await db
      .select()
      .from(schema.studentAnswers)
      .where(eq(schema.studentAnswers.attemptId, attempt.id));

    return NextResponse.json({
      attempt,
      quiz,
      questions: sanitizedQuestions,
      studentAnswers,
    });
  } catch (error) {
    console.error('Error fetching attempt details:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while fetching attempt details' },
      { status: 500 }
    );
  }
}

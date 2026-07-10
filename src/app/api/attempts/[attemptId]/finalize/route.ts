import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{
    attemptId: string;
  }>;
}

export async function POST(req: Request, { params }: RouteContext) {
  const db = getDb();
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'teacher' || !session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { attemptId } = await params;
    if (!attemptId) {
      return NextResponse.json(
        { success: false, message: 'attemptId is required' },
        { status: 400 }
      );
    }

    const [attempt] = await db
      .select()
      .from(schema.quizAttempts)
      .where(eq(schema.quizAttempts.id, attemptId))
      .limit(1);

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

    if (quiz.teacherId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: You do not own this quiz' },
        { status: 403 }
      );
    }

    const questions = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.quizId, quiz.id));

    const studentAnswers = await db
      .select()
      .from(schema.studentAnswers)
      .where(eq(schema.studentAnswers.attemptId, attempt.id));

    const essayQuestions = questions.filter((q) => q.type === 'essay');

    if (essayQuestions.length > 0) {
      const answerIds = studentAnswers.map((a) => a.id);
      const reviews =
        answerIds.length > 0
          ? await db
              .select({ studentAnswerId: schema.essayReviews.studentAnswerId })
              .from(schema.essayReviews)
              .where(inArray(schema.essayReviews.studentAnswerId, answerIds))
          : [];

      const reviewedAnswerIds = new Set(reviews.map((r) => r.studentAnswerId));

      for (const q of essayQuestions) {
        const answer = studentAnswers.find((a) => a.questionId === q.id);
        const hasScore =
          answer && answer.score !== null && answer.score !== undefined;
        const hasReview = answer && reviewedAnswerIds.has(answer.id);

        if (!hasScore && !hasReview) {
          return NextResponse.json(
            {
              success: false,
              message: 'Cannot finalize attempt: some essay responses have not been graded yet.',
            },
            { status: 400 }
          );
        }
      }
    }

    const finalScore = await db.transaction(async (tx) => {
      let total = 0;
      for (const answer of studentAnswers) {
        total += Number(answer.score || 0);
      }

      await tx
        .update(schema.quizAttempts)
        .set({
          totalScore: total.toString(),
          status: 'graded',
          updatedAt: new Date(),
        })
        .where(eq(schema.quizAttempts.id, attempt.id));

      return total;
    });

    return NextResponse.json({
      success: true,
      finalScore,
      status: 'graded',
    });
  } catch (error) {
    console.error('Error finalizing attempt:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while finalizing the attempt' },
      { status: 500 }
    );
  }
}

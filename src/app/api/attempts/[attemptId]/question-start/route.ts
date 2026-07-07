import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{
    attemptId: string;
  }>;
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { attemptId } = await params;
    if (!attemptId) {
      return NextResponse.json(
        { success: false, message: 'attemptId is required' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json(
        { success: false, message: 'questionId is required' },
        { status: 400 }
      );
    }

    const [attempt] = await db
      .select()
      .from(schema.quizAttempts)
      .where(eq(schema.quizAttempts.id, attemptId))
      .limit(1);

    if (!attempt || attempt.status !== 'in_progress') {
      return NextResponse.json(
        { success: false, message: 'Cannot start question for an inactive or completed attempt.' },
        { status: 400 }
      );
    }

    const [quiz] = await db
      .select()
      .from(schema.quizzes)
      .where(eq(schema.quizzes.id, attempt.quizId))
      .limit(1);

    const [question] = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.id, questionId))
      .limit(1);

    if (!question) {
      return NextResponse.json(
        { success: false, message: 'Question not found.' },
        { status: 400 }
      );
    }

    const [studentAnswer] = await db
      .select()
      .from(schema.studentAnswers)
      .where(
        and(
          eq(schema.studentAnswers.attemptId, attempt.id),
          eq(schema.studentAnswers.questionId, questionId)
        )
      )
      .limit(1);

    if (!studentAnswer) {
      return NextResponse.json(
        { success: false, message: 'Student answer record not found.' },
        { status: 400 }
      );
    }

    let questionStartedAt = studentAnswer.questionStartedAt;

    // In per_question mode, when the attempt is created in Phase 3, all questions get questionStartedAt initialized to attempt creation time.
    // When they navigate to Question X for the first time, we record when they actually opened the question.
    // If they already opened it before (or refreshed the page), we keep the original timestamp so they cannot reset the timer.
    if (studentAnswer.status === 'viewing') {
      const attemptStartTime = new Date(attempt.startTime).getTime();
      const currentStartedAt = new Date(studentAnswer.questionStartedAt).getTime();
      // If questionStartedAt is within 5 seconds of attempt.startTime, it has not been started individually yet.
      const isInitialTimestamp = Math.abs(currentStartedAt - attemptStartTime) < 5000;

      if (isInitialTimestamp || quiz?.durationMode === 'per_question') {
        // If it's the initial timestamp, update it to right now.
        if (isInitialTimestamp) {
          questionStartedAt = new Date();
          await db
            .update(schema.studentAnswers)
            .set({
              questionStartedAt,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(schema.studentAnswers.attemptId, attempt.id),
                eq(schema.studentAnswers.questionId, questionId)
              )
            );
        }
      }
    }

    return NextResponse.json({
      success: true,
      questionStartedAt,
      duration: question.duration ?? null,
    });
  } catch (error) {
    console.error('Error starting question timer:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while starting the question timer.' },
      { status: 500 }
    );
  }
}

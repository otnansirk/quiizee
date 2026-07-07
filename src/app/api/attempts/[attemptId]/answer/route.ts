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

    const body = await req.json();
    const { questionId, selectedOptionId, answerText, status } = body;

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
        { success: false, message: 'Cannot submit answers for an inactive or completed attempt.' },
        { status: 400 }
      );
    }

    const [quiz] = await db
      .select()
      .from(schema.quizzes)
      .where(eq(schema.quizzes.id, attempt.quizId))
      .limit(1);

    if (quiz && quiz.durationMode === 'global' && quiz.globalDuration !== null && quiz.globalDuration !== undefined) {
      const elapsed = (Date.now() - new Date(attempt.startTime).getTime()) / 1000;
      if (elapsed > quiz.globalDuration + 10) {
        return NextResponse.json(
          { success: false, message: 'Time has expired for this quiz.' },
          { status: 400 }
        );
      }
    }

    if (quiz && quiz.durationMode === 'per_question') {
      const [question] = await db
        .select()
        .from(schema.questions)
        .where(eq(schema.questions.id, questionId))
        .limit(1);

      if (question && question.duration !== null && question.duration !== undefined && status !== 'timed_out') {
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

        if (studentAnswer && studentAnswer.questionStartedAt) {
          const elapsed = (Date.now() - new Date(studentAnswer.questionStartedAt).getTime()) / 1000;
          if (elapsed > question.duration + 10) {
            return NextResponse.json(
              { success: false, message: 'Time has expired for this question.' },
              { status: 400 }
            );
          }
        }
      }
    }

    await db
      .update(schema.studentAnswers)
      .set({
        selectedOptionId: selectedOptionId || null,
        answerText: answerText || null,
        status: status === 'timed_out' ? 'timed_out' : 'answered',
        questionEndedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.studentAnswers.attemptId, attempt.id),
          eq(schema.studentAnswers.questionId, questionId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while submitting the answer' },
      { status: 500 }
    );
  }
}

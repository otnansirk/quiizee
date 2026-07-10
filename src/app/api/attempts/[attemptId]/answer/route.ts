import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const submitAnswerSchema = z.object({
  questionId: z.string().min(1, 'questionId is required'),
  selectedOptionId: z.string().nullable().optional(),
  answerText: z.string().nullable().optional(),
  status: z.string().optional(),
});

interface RouteContext {
  params: Promise<{
    attemptId: string;
  }>;
}

export async function POST(req: Request, { params }: RouteContext) {
  const db = getDb();
  try {
    const { attemptId } = await params;
    if (!attemptId) {
      return NextResponse.json(
        { success: false, message: 'attemptId is required' },
        { status: 400 }
      );
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = submitAnswerSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body', errors: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { questionId, selectedOptionId, answerText, status } = parseResult.data;

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

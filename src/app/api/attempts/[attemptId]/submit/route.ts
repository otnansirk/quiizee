import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

    let isAutoSubmitted = false;
    try {
      const body = await req.json();
      if (body && body.isAutoSubmitted !== undefined) {
        isAutoSubmitted = Boolean(body.isAutoSubmitted);
      }
    } catch {
      // Body might be empty or invalid JSON
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

    if (attempt.status !== 'in_progress') {
      return NextResponse.json({
        success: true,
        resultCode: attempt.resultCode,
        status: attempt.status,
        totalScore: attempt.totalScore,
      });
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

    const allQuestions = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.quizId, quiz.id));

    const allQuestionOptions = await Promise.all(
      allQuestions.map(async (q) => {
        return await db
          .select()
          .from(schema.questionOptions)
          .where(eq(schema.questionOptions.questionId, q.id));
      })
    ).then((res) => res.flat());

    const studentAnswers = await db
      .select()
      .from(schema.studentAnswers)
      .where(eq(schema.studentAnswers.attemptId, attempt.id));

    const { finalStatus, finalScore } = await db.transaction(async (tx) => {
      let totalScore = 0;
      let hasEssays = false;

      for (const answer of studentAnswers) {
        const question = allQuestions.find((q) => q.id === answer.questionId);
        if (!question) continue;

        const isUnanswered =
          answer.status === 'viewing' ||
          (!answer.selectedOptionId && (!answer.answerText || answer.answerText.trim() === ''));

        if (isUnanswered) {
          await tx
            .update(schema.studentAnswers)
            .set({
              status: 'timed_out' as const,
              score: '0',
              isCorrect: false,
              questionEndedAt: answer.questionEndedAt || new Date(),
              updatedAt: new Date(),
            })
            .where(eq(schema.studentAnswers.id, answer.id));
        } else {
          if (question.type === 'multiple_choice') {
            const selectedOption = allQuestionOptions.find((opt) => opt.id === answer.selectedOptionId);
            const isCorrect = selectedOption?.isCorrect === true;
            const pts = question.points || 0;
            const scoreVal = isCorrect ? pts : 0;
            if (isCorrect) {
              totalScore += pts;
            }
            await tx
              .update(schema.studentAnswers)
              .set({
                isCorrect,
                score: scoreVal.toString(),
                status: 'answered' as const,
                questionEndedAt: answer.questionEndedAt || new Date(),
                updatedAt: new Date(),
              })
              .where(eq(schema.studentAnswers.id, answer.id));
          } else if (question.type === 'true_false') {
            const studentAns = answer.answerText?.trim().toLowerCase() || '';
            const correctAns = question.correctAnswer?.trim().toLowerCase() || '';
            const isCorrect = studentAns === correctAns && studentAns !== '';
            const pts = question.points || 0;
            const scoreVal = isCorrect ? pts : 0;
            if (isCorrect) {
              totalScore += pts;
            }
            await tx
              .update(schema.studentAnswers)
              .set({
                isCorrect,
                score: scoreVal.toString(),
                status: 'answered' as const,
                questionEndedAt: answer.questionEndedAt || new Date(),
                updatedAt: new Date(),
              })
              .where(eq(schema.studentAnswers.id, answer.id));
          } else if (question.type === 'essay') {
            hasEssays = true;
            await tx
              .update(schema.studentAnswers)
              .set({
                isCorrect: null,
                score: null,
                status: 'answered' as const,
                questionEndedAt: answer.questionEndedAt || new Date(),
                updatedAt: new Date(),
              })
              .where(eq(schema.studentAnswers.id, answer.id));
          }
        }
      }

      const statusVal: 'submitted' | 'graded' = hasEssays ? 'submitted' : 'graded';
      const scoreVal: string = totalScore.toString();

      await tx
        .update(schema.quizAttempts)
        .set({
          status: statusVal,
          totalScore: scoreVal,
          endTime: new Date(),
          isAutoSubmitted: Boolean(isAutoSubmitted),
          updatedAt: new Date(),
        })
        .where(eq(schema.quizAttempts.id, attempt.id));

      return { finalStatus: statusVal, finalScore: scoreVal };
    });

    return NextResponse.json({
      success: true,
      resultCode: attempt.resultCode,
      status: finalStatus,
      totalScore: finalScore,
    });
  } catch (error) {
    console.error('Error submitting attempt:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while submitting the attempt' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{
    resultCode: string;
  }>;
}

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const { resultCode } = await params;
    if (!resultCode) {
      return NextResponse.json(
        { success: false, message: 'resultCode is required' },
        { status: 400 }
      );
    }

    const [attempt] = await db
      .select()
      .from(schema.quizAttempts)
      .where(eq(schema.quizAttempts.resultCode, resultCode.trim()))
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

    const quizQuestions = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.quizId, quiz.id))
      .orderBy(asc(schema.questions.order));

    const questions = await Promise.all(
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

    const studentAnswers = await db
      .select()
      .from(schema.studentAnswers)
      .where(eq(schema.studentAnswers.attemptId, attempt.id));

    let studentName: string | null = null;
    let studentEmail: string | null = null;

    if (attempt.userId) {
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, attempt.userId))
        .limit(1);
      if (user) {
        studentName = user.name;
        studentEmail = user.email;
      }
    } else if (attempt.participantId) {
      const [participant] = await db
        .select()
        .from(schema.participants)
        .where(eq(schema.participants.id, attempt.participantId))
        .limit(1);
      if (participant) {
        studentName = participant.name;
        studentEmail = participant.email;
      }
    }

    let certificateAvailable = false;
    if (
      attempt.status === 'graded' &&
      quiz.certificateEnabled === true &&
      quiz.certificateMinScore !== null &&
      quiz.certificateMinScore !== undefined &&
      attempt.totalScore !== null &&
      attempt.totalScore !== undefined &&
      attempt.maxScore !== null &&
      attempt.maxScore !== undefined &&
      Number(attempt.maxScore) > 0
    ) {
      const percentage = (Number(attempt.totalScore) / Number(attempt.maxScore)) * 100;
      if (percentage >= quiz.certificateMinScore) {
        certificateAvailable = true;
      }
    }

    return NextResponse.json({
      attempt,
      quiz,
      questions,
      studentAnswers,
      studentName,
      studentEmail,
      certificateAvailable,
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while fetching results' },
      { status: 500 }
    );
  }
}

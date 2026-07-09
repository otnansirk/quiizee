import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, asc, inArray } from 'drizzle-orm';

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

    const rawStudentAnswers = await db
      .select()
      .from(schema.studentAnswers)
      .where(eq(schema.studentAnswers.attemptId, attempt.id));

    const answerIds = rawStudentAnswers.map((a) => a.id);
    const essayReviewsList =
      answerIds.length > 0
        ? await db
            .select()
            .from(schema.essayReviews)
            .where(inArray(schema.essayReviews.studentAnswerId, answerIds))
        : [];

    const studentAnswers = rawStudentAnswers.map((ans) => {
      const review = essayReviewsList.find((r) => r.studentAnswerId === ans.id);
      return {
        ...ans,
        score: review?.score !== undefined && review?.score !== null ? review.score : ans.score,
        feedback: review?.feedback || null,
        isGraded: review !== undefined || (ans.score !== null && ans.score !== undefined),
      };
    });

    if (attempt.status === 'submitted') {
      const essayQuestions = questions.filter((q) => q.type === 'essay');
      const allEssaysScored = essayQuestions.every((q) => {
        const ans = studentAnswers.find((a) => a.questionId === q.id);
        return ans && ans.score !== null && ans.score !== undefined;
      });
      if (essayQuestions.length === 0 || allEssaysScored) {
        await db
          .update(schema.quizAttempts)
          .set({ status: 'graded', updatedAt: new Date() })
          .where(eq(schema.quizAttempts.id, attempt.id));
        attempt.status = 'graded';
      }
    }

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
      answers: studentAnswers,
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

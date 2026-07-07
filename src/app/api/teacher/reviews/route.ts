import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const teacherQuizzes = await db
      .select({ id: schema.quizzes.id, title: schema.quizzes.title })
      .from(schema.quizzes)
      .where(eq(schema.quizzes.teacherId, session.user.id));

    if (teacherQuizzes.length === 0) {
      return NextResponse.json([]);
    }

    const quizIds = teacherQuizzes.map((q) => q.id);
    const quizMap = new Map(teacherQuizzes.map((q) => [q.id, q.title]));

    const attempts = await db
      .select()
      .from(schema.quizAttempts)
      .where(
        and(
          inArray(schema.quizAttempts.quizId, quizIds),
          eq(schema.quizAttempts.status, 'submitted')
        )
      )
      .orderBy(desc(schema.quizAttempts.endTime), desc(schema.quizAttempts.updatedAt));

    if (attempts.length === 0) {
      return NextResponse.json([]);
    }

    const userIds = attempts
      .map((a) => a.userId)
      .filter((id): id is string => Boolean(id));
    const participantIds = attempts
      .map((a) => a.participantId)
      .filter((id): id is string => Boolean(id));

    const usersList =
      userIds.length > 0
        ? await db
            .select({
              id: schema.users.id,
              name: schema.users.name,
              email: schema.users.email,
            })
            .from(schema.users)
            .where(inArray(schema.users.id, userIds))
        : [];

    const participantsList =
      participantIds.length > 0
        ? await db
            .select({
              id: schema.participants.id,
              name: schema.participants.name,
              email: schema.participants.email,
            })
            .from(schema.participants)
            .where(inArray(schema.participants.id, participantIds))
        : [];

    const userMap = new Map(usersList.map((u) => [u.id, u]));
    const participantMap = new Map(participantsList.map((p) => [p.id, p]));

    const essayQuestions = await db
      .select({ id: schema.questions.id })
      .from(schema.questions)
      .where(
        and(
          inArray(schema.questions.quizId, quizIds),
          eq(schema.questions.type, 'essay')
        )
      );

    const essayQuestionIds = essayQuestions.map((q) => q.id);
    const ungradedCountMap = new Map<string, number>();

    if (essayQuestionIds.length > 0) {
      const attemptIds = attempts.map((a) => a.id);
      const essayAnswers = await db
        .select({
          id: schema.studentAnswers.id,
          attemptId: schema.studentAnswers.attemptId,
          score: schema.studentAnswers.score,
        })
        .from(schema.studentAnswers)
        .where(
          and(
            inArray(schema.studentAnswers.attemptId, attemptIds),
            inArray(schema.studentAnswers.questionId, essayQuestionIds)
          )
        );

      for (const ans of essayAnswers) {
        if (ans.score === null || ans.score === undefined) {
          const current = ungradedCountMap.get(ans.attemptId) || 0;
          ungradedCountMap.set(ans.attemptId, current + 1);
        }
      }
    }

    const attemptsNeedingReview = attempts.map((attempt) => {
      let studentName = 'Unknown Student';
      let studentEmail = 'unknown@example.com';

      if (attempt.userId && userMap.has(attempt.userId)) {
        const u = userMap.get(attempt.userId)!;
        studentName = u.name;
        studentEmail = u.email;
      } else if (attempt.participantId && participantMap.has(attempt.participantId)) {
        const p = participantMap.get(attempt.participantId)!;
        studentName = p.name;
        studentEmail = p.email;
      }

      return {
        ...attempt,
        quizTitle: quizMap.get(attempt.quizId) || 'Unknown Quiz',
        studentName,
        studentEmail,
        ungradedEssaysCount: ungradedCountMap.get(attempt.id) || 0,
      };
    });

    return NextResponse.json(attemptsNeedingReview);
  } catch (error) {
    console.error('Error fetching teacher reviews:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while fetching reviews' },
      { status: 500 }
    );
  }
}

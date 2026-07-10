import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{
    quizId: string;
  }>;
}

export async function GET(req: Request, { params }: RouteContext) {
  const db = getDb();
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { quizId } = await params;
    if (!quizId) {
      return NextResponse.json(
        { success: false, message: 'quizId is required' },
        { status: 400 }
      );
    }

    const [quiz] = await db
      .select()
      .from(schema.quizzes)
      .where(eq(schema.quizzes.id, quizId))
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

    const attempts = await db
      .select()
      .from(schema.quizAttempts)
      .where(eq(schema.quizAttempts.quizId, quizId))
      .orderBy(desc(schema.quizAttempts.startTime));

    if (attempts.length === 0) {
      return NextResponse.json([]);
    }

    const allQuizQuestions = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.quizId, quizId));
    const essayQuestions = allQuizQuestions.filter((q) => q.type === 'essay');

    if (attempts.some((a) => a.status === 'submitted')) {
      const attemptIds = attempts.map((a) => a.id);
      const allStudentAnswers = await db
        .select()
        .from(schema.studentAnswers)
        .where(inArray(schema.studentAnswers.attemptId, attemptIds));

      for (const att of attempts) {
        if (att.status === 'submitted') {
          if (essayQuestions.length === 0) {
            await db
              .update(schema.quizAttempts)
              .set({ status: 'graded', updatedAt: new Date() })
              .where(eq(schema.quizAttempts.id, att.id));
            att.status = 'graded';
          } else {
            const allEssaysScored = essayQuestions.every((q) => {
              const ans = allStudentAnswers.find((a) => a.attemptId === att.id && a.questionId === q.id);
              return ans && ans.score !== null && ans.score !== undefined;
            });
            if (allEssaysScored) {
              await db
                .update(schema.quizAttempts)
                .set({ status: 'graded', updatedAt: new Date() })
                .where(eq(schema.quizAttempts.id, att.id));
              att.status = 'graded';
            }
          }
        }
      }
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

    const attemptsWithStudentInfo = attempts.map((attempt) => {
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
        studentName,
        studentEmail,
      };
    });

    return NextResponse.json(attemptsWithStudentInfo);
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while fetching quiz attempts' },
      { status: 500 }
    );
  }
}

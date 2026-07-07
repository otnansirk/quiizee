import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and, asc, inArray } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{
    attemptId: string;
  }>;
}

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'teacher') {
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
      .where(eq(schema.questions.quizId, quiz.id))
      .orderBy(asc(schema.questions.order));

    const studentAnswers = await db
      .select()
      .from(schema.studentAnswers)
      .where(eq(schema.studentAnswers.attemptId, attempt.id));

    const answerIds = studentAnswers.map((a) => a.id);
    const essayReviews =
      answerIds.length > 0
        ? await db
            .select()
            .from(schema.essayReviews)
            .where(inArray(schema.essayReviews.studentAnswerId, answerIds))
        : [];

    let studentName = 'Unknown Student';
    let studentEmail = 'unknown@example.com';

    if (attempt.userId) {
      const [user] = await db
        .select({ name: schema.users.name, email: schema.users.email })
        .from(schema.users)
        .where(eq(schema.users.id, attempt.userId))
        .limit(1);
      if (user) {
        studentName = user.name;
        studentEmail = user.email;
      }
    } else if (attempt.participantId) {
      const [participant] = await db
        .select({
          name: schema.participants.name,
          email: schema.participants.email,
        })
        .from(schema.participants)
        .where(eq(schema.participants.id, attempt.participantId))
        .limit(1);
      if (participant) {
        studentName = participant.name;
        studentEmail = participant.email;
      }
    }

    return NextResponse.json({
      attempt,
      quiz,
      questions,
      studentAnswers,
      essayReviews,
      studentName,
      studentEmail,
    });
  } catch (error) {
    console.error('Error fetching attempt review details:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while fetching review details' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: RouteContext) {
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

    const body = await req.json();
    const { studentAnswerId, score, feedback } = body;

    if (!studentAnswerId || score === undefined || score === null) {
      return NextResponse.json(
        { success: false, message: 'studentAnswerId and score are required' },
        { status: 400 }
      );
    }

    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 0) {
      return NextResponse.json(
        { success: false, message: 'Score must be a valid number greater than or equal to 0' },
        { status: 400 }
      );
    }

    const [studentAnswer] = await db
      .select()
      .from(schema.studentAnswers)
      .where(
        and(
          eq(schema.studentAnswers.id, studentAnswerId),
          eq(schema.studentAnswers.attemptId, attemptId)
        )
      )
      .limit(1);

    if (!studentAnswer) {
      return NextResponse.json(
        { success: false, message: 'Student answer not found for this attempt' },
        { status: 404 }
      );
    }

    const [question] = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.id, studentAnswer.questionId))
      .limit(1);

    if (!question) {
      return NextResponse.json(
        { success: false, message: 'Question not found' },
        { status: 404 }
      );
    }

    if (question.type !== 'essay') {
      return NextResponse.json(
        { success: false, message: 'Only essay questions can be reviewed here' },
        { status: 400 }
      );
    }

    const maxPoints = question.points || 0;
    if (numScore > maxPoints) {
      return NextResponse.json(
        { success: false, message: `Score cannot exceed maximum points (${maxPoints}) for this question` },
        { status: 400 }
      );
    }

    await db.transaction(async (tx) => {
      const [existingReview] = await tx
        .select()
        .from(schema.essayReviews)
        .where(eq(schema.essayReviews.studentAnswerId, studentAnswerId))
        .limit(1);

      if (existingReview) {
        await tx
          .update(schema.essayReviews)
          .set({
            score: numScore.toString(),
            feedback: feedback || null,
            reviewedAt: new Date(),
            teacherId: session.user!.id!,
            updatedAt: new Date(),
          })
          .where(eq(schema.essayReviews.studentAnswerId, studentAnswerId));
      } else {
        await tx.insert(schema.essayReviews).values({
          studentAnswerId,
          teacherId: session.user!.id!,
          score: numScore.toString(),
          feedback: feedback || null,
          reviewedAt: new Date(),
        });
      }

      await tx
        .update(schema.studentAnswers)
        .set({
          score: numScore.toString(),
          isCorrect: numScore > 0,
          updatedAt: new Date(),
        })
        .where(eq(schema.studentAnswers.id, studentAnswerId));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reviewing essay answer:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while saving the review' },
      { status: 500 }
    );
  }
}

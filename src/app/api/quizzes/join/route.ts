import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateResultCode } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accessCode, name, email } = body;

    if (!accessCode || typeof accessCode !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid or unpublished quiz access code' },
        { status: 400 }
      );
    }

    const [quiz] = await db
      .select()
      .from(schema.quizzes)
      .where(eq(schema.quizzes.accessCode, accessCode.trim()))
      .limit(1);

    if (!quiz || !quiz.isPublished) {
      return NextResponse.json(
        { success: false, message: 'Invalid or unpublished quiz access code' },
        { status: 404 }
      );
    }

    let userId: string | null = null;
    let participantId: string | null = null;
    let existingCount = 0;

    // All assessments are accessed via Access Code + Student Name & Email (no student login required)
    if (!name || !email || typeof name !== 'string' || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Name and email are required to join assessments' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    const [existingParticipant] = await db
      .select()
      .from(schema.participants)
      .where(
        and(
          eq(schema.participants.quizId, quiz.id),
          eq(schema.participants.email, trimmedEmail)
        )
      )
      .limit(1);

    if (existingParticipant) {
      participantId = existingParticipant.id;
    } else {
      const [newParticipant] = await db
        .insert(schema.participants)
        .values({
          quizId: quiz.id,
          name: trimmedName,
          email: trimmedEmail,
        })
        .returning();
      participantId = newParticipant.id;
    }

    userId = null;

    // Explicitly check attempt count against this student's email address
    const existingAttempts = await db
      .select({ id: schema.quizAttempts.id })
      .from(schema.quizAttempts)
      .innerJoin(
        schema.participants,
        eq(schema.quizAttempts.participantId, schema.participants.id)
      )
      .where(
        and(
          eq(schema.quizAttempts.quizId, quiz.id),
          eq(schema.participants.email, trimmedEmail)
        )
      );

    existingCount = existingAttempts.length;
    if (existingCount >= quiz.maxAttempts) {
      return NextResponse.json(
        { success: false, message: 'You have reached the maximum number of attempts allowed for this quiz.' },
        { status: 403 }
      );
    }

    const { attemptId, resultCode } = await db.transaction(async (tx) => {
      let resCode = '';
      for (let i = 0; i < 5; i++) {
        const candidate = generateResultCode();
        const existing = await tx
          .select({ id: schema.quizAttempts.id })
          .from(schema.quizAttempts)
          .where(eq(schema.quizAttempts.resultCode, candidate))
          .limit(1);
        if (existing.length === 0) {
          resCode = candidate;
          break;
        }
      }
      if (!resCode) {
        throw new Error('Failed to generate unique result code');
      }

      const questions = await tx.query.questions.findMany({
        where: eq(schema.questions.quizId, quiz.id),
      });

      const maxScore = questions.reduce((sum, q) => sum + (q.points || 0), 0);

      const [attempt] = await tx
        .insert(schema.quizAttempts)
        .values({
          quizId: quiz.id,
          userId: userId || null,
          participantId: participantId || null,
          resultCode: resCode,
          attemptNumber: existingCount + 1,
          startTime: new Date(),
          maxScore: maxScore.toString(),
          status: 'in_progress' as const,
        })
        .returning();

      if (questions && questions.length > 0) {
        await tx.insert(schema.studentAnswers).values(
          questions.map((q) => ({
            attemptId: attempt.id,
            questionId: q.id,
            questionStartedAt: new Date(),
            status: 'viewing' as const,
          }))
        );
      }

      return { attemptId: attempt.id, resultCode: resCode };
    });

    return NextResponse.json(
      { attemptId, resultCode, durationMode: quiz.durationMode },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error joining quiz:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while joining the quiz' },
      { status: 500 }
    );
  }
}

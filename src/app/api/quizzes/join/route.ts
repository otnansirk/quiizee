import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateResultCode } from '@/lib/utils';
import { z } from 'zod';

const joinQuizSchema = z.object({
  accessCode: z.string().min(1, 'accessCode is required'),
  name: z.string().optional(),
  email: z.string().optional(),
});

export async function POST(req: Request) {
  const db = getDb();
  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = joinQuizSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body', errors: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { accessCode, name, email } = parseResult.data;

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

    if (quiz.expiresAt && new Date() > new Date(quiz.expiresAt)) {
      return NextResponse.json(
        { success: false, message: 'This quiz has expired and is no longer accepting new attempts.' },
        { status: 403 }
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

    if (quiz.accessMode === 'strict') {
      const allowedEmailsList = (quiz.allowedEmails || '')
        .split(/\r?\n|,/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      if (!allowedEmailsList.includes(trimmedEmail)) {
        return NextResponse.json(
          { success: false, message: 'Your email address is not on the authorized list to join this quiz.' },
          { status: 403 }
        );
      }
    }

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

    // Explicitly check attempt count and status against this student's email address
    const existingAttempts = await db
      .select({
        id: schema.quizAttempts.id,
        status: schema.quizAttempts.status,
        resultCode: schema.quizAttempts.resultCode,
      })
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
    const inProgressAttempt = existingAttempts.find((a) => a.status === 'in_progress');

    if (inProgressAttempt) {
      if (quiz.canResume) {
        return NextResponse.json(
          {
            attemptId: inProgressAttempt.id,
            resultCode: inProgressAttempt.resultCode,
            durationMode: quiz.durationMode,
            resumed: true,
          },
          { status: 200 }
        );
      } else {
        if (existingCount >= quiz.maxAttempts) {
          return NextResponse.json(
            { success: false, message: 'You have reached the maximum number of attempts allowed for this quiz.' },
            { status: 403 }
          );
        }
      }
    } else {
      if (existingCount >= quiz.maxAttempts) {
        return NextResponse.json(
          { success: false, message: 'You have reached the maximum number of attempts allowed for this quiz.' },
          { status: 403 }
        );
      }
    }

    let resCode = '';
    for (let i = 0; i < 5; i++) {
      const candidate = generateResultCode();
      const existing = await db
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

    const questions = await db.query.questions.findMany({
      where: eq(schema.questions.quizId, quiz.id),
    });

    const maxScore = questions.reduce((sum, q) => sum + (q.points || 0), 0);

    const [attempt] = await db
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
      await db.insert(schema.studentAnswers).values(
        questions.map((q) => ({
          attemptId: attempt.id,
          questionId: q.id,
          questionStartedAt: attempt.startTime,
          status: 'viewing' as const,
        }))
      );
    }

    const attemptId = attempt.id;
    const resultCode = resCode;

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

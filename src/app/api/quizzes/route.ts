import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { generateAccessCode } from '@/lib/utils';
import { z } from 'zod';

const createQuizSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  accessMode: z.string().optional(),
  durationMode: z.string().optional(),
  globalDuration: z.union([z.number(), z.string()]).nullable().optional(),
  maxAttempts: z.union([z.number(), z.string()]).nullable().optional(),
  certificateEnabled: z.union([z.boolean(), z.string()]).optional(),
  certificateMinScore: z.union([z.number(), z.string()]).optional(),
  certificateSignerName: z.string().nullable().optional(),
  certificateSignerRole: z.string().nullable().optional(),
  certificateSignatureUrl: z.string().nullable().optional(),
});

export async function GET() {
  const db = getDb();
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const teacherQuizzes = await db
      .select()
      .from(schema.quizzes)
      .where(eq(schema.quizzes.teacherId, session.user.id))
      .orderBy(desc(schema.quizzes.createdAt));

    if (teacherQuizzes.length === 0) {
      return NextResponse.json([]);
    }

    const quizIds = teacherQuizzes.map((q) => q.id);
    const allQuestions = await db
      .select({ id: schema.questions.id, quizId: schema.questions.quizId })
      .from(schema.questions)
      .where(inArray(schema.questions.quizId, quizIds));

    const countByQuizId = allQuestions.reduce((acc, q) => {
      acc[q.quizId] = (acc[q.quizId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const quizzesWithCount = teacherQuizzes.map((quiz) => ({
      ...quiz,
      questionCount: countByQuizId[quiz.id] || 0,
    }));

    return NextResponse.json(quizzesWithCount);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while fetching quizzes' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const db = getDb();
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = createQuizSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body', errors: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const {
      title,
      description,
      accessMode,
      durationMode,
      globalDuration,
      maxAttempts,
      certificateEnabled,
      certificateMinScore,
      certificateSignerName,
      certificateSignerRole,
      certificateSignatureUrl,
    } = parseResult.data;

    // Validate required fields
    if (!title || !accessMode || !durationMode) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: title, accessMode, or durationMode' },
        { status: 400 }
      );
    }

    if (!['public', 'private'].includes(accessMode)) {
      return NextResponse.json(
        { success: false, message: "Invalid accessMode. Must be 'public' or 'private'." },
        { status: 400 }
      );
    }

    if (!['global', 'per_question'].includes(durationMode)) {
      return NextResponse.json(
        { success: false, message: "Invalid durationMode. Must be 'global' or 'per_question'." },
        { status: 400 }
      );
    }

    // Generate unique accessCode with retry loop
    let accessCode = '';
    let isUnique = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidateCode = generateAccessCode();
      const existing = await db
        .select({ id: schema.quizzes.id })
        .from(schema.quizzes)
        .where(eq(schema.quizzes.accessCode, candidateCode))
        .limit(1);

      if (existing.length === 0) {
        accessCode = candidateCode;
        isUnique = true;
        break;
      }
    }

    if (!isUnique) {
      return NextResponse.json(
        { success: false, message: 'Failed to generate a unique access code. Please try again.' },
        { status: 500 }
      );
    }

    const [newQuiz] = await db
      .insert(schema.quizzes)
      .values({
        teacherId: session.user.id,
        title: title.trim(),
        description: description ? description.trim() : null,
        accessCode,
        accessMode: accessMode as 'public' | 'private',
        durationMode: durationMode as 'global' | 'per_question',
        globalDuration: globalDuration !== undefined && globalDuration !== null ? Number(globalDuration) : null,
        maxAttempts: maxAttempts !== undefined && maxAttempts !== null ? Number(maxAttempts) : 1,
        certificateEnabled: certificateEnabled === true || certificateEnabled === 'true',
        certificateMinScore: certificateMinScore !== undefined && certificateMinScore !== null ? Number(certificateMinScore) : null,
        certificateSignerName: certificateSignerName ? certificateSignerName.trim() : null,
        certificateSignerRole: certificateSignerRole ? certificateSignerRole.trim() : null,
        certificateSignatureUrl: certificateSignatureUrl ? certificateSignatureUrl.trim() : null,
      })
      .returning();

    return NextResponse.json(newQuiz, { status: 201 });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while creating the quiz' },
      { status: 500 }
    );
  }
}

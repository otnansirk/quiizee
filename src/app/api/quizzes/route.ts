import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateAccessCode } from '@/lib/utils';

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
      .select()
      .from(schema.quizzes)
      .where(eq(schema.quizzes.teacherId, session.user.id))
      .orderBy(desc(schema.quizzes.createdAt));

    const quizzesWithCount = await Promise.all(
      teacherQuizzes.map(async (quiz) => {
        const quizQuestions = await db
          .select({ id: schema.questions.id })
          .from(schema.questions)
          .where(eq(schema.questions.quizId, quiz.id));

        return {
          ...quiz,
          questionCount: quizQuestions.length,
        };
      })
    );

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
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
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
    } = body;

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

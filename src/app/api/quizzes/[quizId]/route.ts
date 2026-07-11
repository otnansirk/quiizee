import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, asc, inArray } from 'drizzle-orm';
import { z } from 'zod';

const updateQuizSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  accessMode: z.string().optional(),
  durationMode: z.string().optional(),
  globalDuration: z.union([z.number(), z.string()]).nullable().optional(),
  maxAttempts: z.union([z.number(), z.string()]).nullable().optional(),
  certificateEnabled: z.union([z.boolean(), z.string()]).optional(),
  certificateMinScore: z.union([z.number(), z.string()]).nullable().optional(),
  certificateSignerName: z.string().nullable().optional(),
  certificateSignerRole: z.string().nullable().optional(),
  certificateSignatureUrl: z.string().nullable().optional(),
  isPublished: z.union([z.boolean(), z.string()]).optional(),
}).superRefine((data, ctx) => {
  const isCertEnabled = data.certificateEnabled === true || data.certificateEnabled === 'true';
  if (isCertEnabled) {
    if (data.certificateMinScore === null || data.certificateMinScore === undefined || data.certificateMinScore === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Certificate minimum score is required when certificate is enabled.',
        path: ['certificateMinScore'],
      });
    } else {
      const num = Number(data.certificateMinScore);
      if (isNaN(num) || num < 1 || num > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Certificate minimum score must be a number between 1 and 100.',
          path: ['certificateMinScore'],
        });
      }
    }
  }
});

interface RouteContext {
  params: Promise<{
    quizId: string;
  }>;
}

async function checkTeacherAndQuiz(quizId: string) {
  const db = getDb();
  const session = await auth();
  if (!session?.user || session.user.role !== 'teacher') {
    return {
      error: NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  const [quiz] = await db
    .select()
    .from(schema.quizzes)
    .where(eq(schema.quizzes.id, quizId))
    .limit(1);

  if (!quiz) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Quiz not found' },
        { status: 404 }
      ),
    };
  }

  if (quiz.teacherId !== session.user.id) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      ),
    };
  }

  return { session, quiz };
}

export async function GET(req: Request, { params }: RouteContext) {
  const db = getDb();
  try {
    const { quizId } = await params;
    const { error, quiz } = await checkTeacherAndQuiz(quizId);
    if (error) return error;
    if (!quiz) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    const quizQuestions = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.quizId, quizId))
      .orderBy(asc(schema.questions.order));

    const questionsWithOptions = await Promise.all(
      quizQuestions.map(async (question) => {
        const options = await db
          .select()
          .from(schema.questionOptions)
          .where(eq(schema.questionOptions.questionId, question.id))
          .orderBy(asc(schema.questionOptions.order));

        const studentAnswers = await db
          .select({ id: schema.studentAnswers.id })
          .from(schema.studentAnswers)
          .where(eq(schema.studentAnswers.questionId, question.id));

        return {
          ...question,
          options,
          hasSubmissions: studentAnswers.length > 0,
          submissionsCount: studentAnswers.length,
        };
      })
    );

    return NextResponse.json({
      ...quiz,
      questions: questionsWithOptions,
    });
  } catch (error) {
    console.error('Error fetching quiz details:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while fetching quiz details' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: RouteContext) {
  const db = getDb();
  try {
    const { quizId } = await params;
    const { error, quiz } = await checkTeacherAndQuiz(quizId);
    if (error) return error;
    if (!quiz) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = updateQuizSchema.safeParse(rawBody);
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
      isPublished,
    } = parseResult.data;

    const updateData: Partial<schema.NewQuiz> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description !== null ? description.trim() : null;
    if (accessMode !== undefined) {
      if (!['public', 'private'].includes(accessMode)) {
        return NextResponse.json(
          { success: false, message: "Invalid accessMode. Must be 'public' or 'private'." },
          { status: 400 }
        );
      }
      updateData.accessMode = accessMode as 'public' | 'private';
    }
    if (durationMode !== undefined) {
      if (!['global', 'per_question'].includes(durationMode)) {
        return NextResponse.json(
          { success: false, message: "Invalid durationMode. Must be 'global' or 'per_question'." },
          { status: 400 }
        );
      }
      updateData.durationMode = durationMode as 'global' | 'per_question';
    }
    if (globalDuration !== undefined) updateData.globalDuration = globalDuration !== null ? Number(globalDuration) : null;
    if (maxAttempts !== undefined) updateData.maxAttempts = maxAttempts !== null ? Number(maxAttempts) : 1;
    if (certificateEnabled !== undefined) updateData.certificateEnabled = certificateEnabled === true || certificateEnabled === 'true';
    if (certificateMinScore !== undefined) updateData.certificateMinScore = certificateMinScore !== null ? Number(certificateMinScore) : null;
    if (certificateSignerName !== undefined) updateData.certificateSignerName = certificateSignerName !== null ? certificateSignerName.trim() : null;
    if (certificateSignerRole !== undefined) updateData.certificateSignerRole = certificateSignerRole !== null ? certificateSignerRole.trim() : null;
    if (certificateSignatureUrl !== undefined) updateData.certificateSignatureUrl = certificateSignatureUrl !== null ? certificateSignatureUrl.trim() : null;

    if (isPublished !== undefined) {
      const publishing = isPublished === true || isPublished === 'true';
      if (publishing) {
        // Check that the quiz has at least 1 question
        const existingQuestions = await db
          .select({ id: schema.questions.id })
          .from(schema.questions)
          .where(eq(schema.questions.quizId, quizId));

        if (existingQuestions.length === 0) {
          return NextResponse.json(
            { success: false, message: 'Cannot publish a quiz with no questions' },
            { status: 400 }
          );
        }

        // If publishing for the first time
        if (!quiz.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }
      updateData.isPublished = publishing;
    }

    const [updatedQuiz] = await db
      .update(schema.quizzes)
      .set(updateData)
      .where(eq(schema.quizzes.id, quizId))
      .returning();

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error('Error updating quiz:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while updating the quiz' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  return PUT(req, context);
}

export async function DELETE(req: Request, { params }: RouteContext) {
  const db = getDb();
  try {
    const { quizId } = await params;
    const { error, quiz } = await checkTeacherAndQuiz(quizId);
    if (error) return error;
    if (!quiz) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    await db.transaction(async (tx) => {
      // 1. Find all attempts for this quiz
      const attempts = await tx
        .select({ id: schema.quizAttempts.id })
        .from(schema.quizAttempts)
        .where(eq(schema.quizAttempts.quizId, quizId));

      if (attempts.length > 0) {
        const attemptIds = attempts.map((a) => a.id);
        const answers = await tx
          .select({ id: schema.studentAnswers.id })
          .from(schema.studentAnswers)
          .where(inArray(schema.studentAnswers.attemptId, attemptIds));

        if (answers.length > 0) {
          const answerIds = answers.map((a) => a.id);
          await tx
            .delete(schema.essayReviews)
            .where(inArray(schema.essayReviews.studentAnswerId, answerIds));

          await tx
            .delete(schema.studentAnswers)
            .where(inArray(schema.studentAnswers.id, answerIds));
        }

        await tx
          .delete(schema.quizAttempts)
          .where(inArray(schema.quizAttempts.id, attemptIds));
      }

      // 2. Delete all participants for this quiz
      await tx
        .delete(schema.participants)
        .where(eq(schema.participants.quizId, quizId));

      // 3. Find and delete all questions & their options for this quiz
      const quizQuestions = await tx
        .select({ id: schema.questions.id })
        .from(schema.questions)
        .where(eq(schema.questions.quizId, quizId));

      if (quizQuestions.length > 0) {
        const questionIds = quizQuestions.map((q) => q.id);
        await tx
          .delete(schema.questionOptions)
          .where(inArray(schema.questionOptions.questionId, questionIds));

        // Just in case any student answers were not tied to attemptIds
        await tx
          .delete(schema.studentAnswers)
          .where(inArray(schema.studentAnswers.questionId, questionIds));
      }

      await tx
        .delete(schema.questions)
        .where(eq(schema.questions.quizId, quizId));

      // 4. Delete the quiz itself
      await tx
        .delete(schema.quizzes)
        .where(eq(schema.quizzes.id, quizId));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while deleting the quiz' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';

const optionInputSchema = z.object({
  id: z.string().optional(),
  optionText: z.string().optional(),
  isCorrect: z.boolean().optional(),
  order: z.number().optional(),
});

const updateQuestionSchema = z.object({
  type: z.string().optional(),
  questionText: z.string().optional(),
  questionImage: z.string().nullable().optional(),
  duration: z.union([z.number(), z.string()]).nullable().optional(),
  points: z.union([z.number(), z.string()]).nullable().optional(),
  order: z.union([z.number(), z.string()]).optional(),
  correctAnswer: z.string().nullable().optional(),
  options: z.array(optionInputSchema).optional(),
  regrade: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{
    quizId: string;
    questionId: string;
  }>;
}

interface OptionInput {
  id?: string;
  optionText?: string;
  isCorrect?: boolean;
  order?: number;
}

async function checkTeacherAndQuestion(quizId: string, questionId: string) {
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

  const [question] = await db
    .select()
    .from(schema.questions)
    .where(and(eq(schema.questions.id, questionId), eq(schema.questions.quizId, quizId)))
    .limit(1);

  if (!question) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Question not found' },
        { status: 404 }
      ),
    };
  }

  return { session, quiz, question };
}

export async function PUT(req: Request, { params }: RouteContext) {
  const db = getDb();
  try {
    const { quizId, questionId } = await params;
    const { error, question } = await checkTeacherAndQuestion(quizId, questionId);
    if (error) return error;
    if (!question) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = updateQuestionSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body', errors: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const {
      type,
      questionText,
      questionImage,
      duration,
      points,
      order,
      correctAnswer,
      options,
      regrade,
    } = parseResult.data;

    if (type !== undefined && !['multiple_choice', 'true_false', 'essay'].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid question type. Must be 'multiple_choice', 'true_false', or 'essay'." },
        { status: 400 }
      );
    }

    await db.transaction(async (tx) => {
      const updateData: Partial<schema.NewQuestion> = {
        updatedAt: new Date(),
      };

      if (type !== undefined) updateData.type = type as 'multiple_choice' | 'true_false' | 'essay';
      if (questionText !== undefined) updateData.questionText = questionText.trim();
      if (questionImage !== undefined) updateData.questionImage = questionImage !== null ? questionImage.trim() : null;
      if (duration !== undefined) updateData.duration = duration !== null ? Number(duration) : null;
      if (points !== undefined) updateData.points = points !== null ? Number(points) : 1;
      if (order !== undefined) updateData.order = Number(order);
      if (correctAnswer !== undefined) {
        updateData.correctAnswer = correctAnswer !== null ? String(correctAnswer) : null;
      } else if (
        (type !== undefined ? type : question.type) === 'multiple_choice' &&
        Array.isArray(options)
      ) {
        const correctOptText = String(
          (options as OptionInput[]).find((o) => o.isCorrect)?.optionText || ''
        ).trim();
        updateData.correctAnswer = correctOptText || null;
      }

      await tx
        .update(schema.questions)
        .set(updateData)
        .where(eq(schema.questions.id, questionId));

      const effectiveType = type !== undefined ? type : question.type;

      if (effectiveType === 'multiple_choice' && Array.isArray(options)) {
        const existingOptions = await tx
          .select()
          .from(schema.questionOptions)
          .where(eq(schema.questionOptions.questionId, questionId));

        const inputOpts = options as OptionInput[];
        const existingIdsMap = new Map(existingOptions.map((o) => [o.id, o]));
        const processedIds = new Set<string>();

        const remainingInputOpts: { opt: OptionInput; idx: number }[] = [];
        for (let idx = 0; idx < inputOpts.length; idx++) {
          const opt = inputOpts[idx];
          if (opt.id && existingIdsMap.has(opt.id)) {
            await tx
              .update(schema.questionOptions)
              .set({
                optionText: String(opt.optionText || '').trim(),
                isCorrect: Boolean(opt.isCorrect),
                order: opt.order !== undefined && opt.order !== null ? Number(opt.order) : idx + 1,
              })
              .where(eq(schema.questionOptions.id, opt.id));
            processedIds.add(opt.id);
          } else {
            remainingInputOpts.push({ opt, idx });
          }
        }

        const remainingExisting = existingOptions.filter((o) => !processedIds.has(o.id));
        for (let i = 0; i < remainingInputOpts.length; i++) {
          const { opt, idx } = remainingInputOpts[i];
          if (i < remainingExisting.length) {
            const existingToUpdate = remainingExisting[i];
            await tx
              .update(schema.questionOptions)
              .set({
                optionText: String(opt.optionText || '').trim(),
                isCorrect: Boolean(opt.isCorrect),
                order: opt.order !== undefined && opt.order !== null ? Number(opt.order) : idx + 1,
              })
              .where(eq(schema.questionOptions.id, existingToUpdate.id));
            processedIds.add(existingToUpdate.id);
          } else {
            await tx.insert(schema.questionOptions).values({
              questionId,
              optionText: String(opt.optionText || '').trim(),
              isCorrect: Boolean(opt.isCorrect),
              order: opt.order !== undefined && opt.order !== null ? Number(opt.order) : idx + 1,
            });
          }
        }

        const toDelete = existingOptions.filter((o) => !processedIds.has(o.id));
        for (const delOpt of toDelete) {
          try {
            await tx
              .delete(schema.questionOptions)
              .where(eq(schema.questionOptions.id, delOpt.id));
          } catch (err) {
            await tx
              .update(schema.questionOptions)
              .set({ isCorrect: false })
              .where(eq(schema.questionOptions.id, delOpt.id));
          }
        }
      } else if (type !== undefined && type !== 'multiple_choice' && question.type === 'multiple_choice') {
        const existingOptions = await tx
          .select()
          .from(schema.questionOptions)
          .where(eq(schema.questionOptions.questionId, questionId));
        for (const delOpt of existingOptions) {
          try {
            await tx
              .delete(schema.questionOptions)
              .where(eq(schema.questionOptions.id, delOpt.id));
          } catch (err) {
            await tx
              .update(schema.questionOptions)
              .set({ isCorrect: false })
              .where(eq(schema.questionOptions.id, delOpt.id));
          }
        }
      }

      if (regrade === true) {
        const updatedQuestionRows = await tx
          .select()
          .from(schema.questions)
          .where(eq(schema.questions.id, questionId))
          .limit(1);
        const updatedQ = updatedQuestionRows[0];
        if (updatedQ) {
          const questionPoints = Number(updatedQ.points || 1);
          const allStudentAnswers = await tx
            .select()
            .from(schema.studentAnswers)
            .where(eq(schema.studentAnswers.questionId, questionId));

          if (allStudentAnswers.length > 0) {
            const affectedAttemptIds = new Set<string>();
            if (updatedQ.type === 'multiple_choice') {
              const currentOptions = await tx
                .select()
                .from(schema.questionOptions)
                .where(eq(schema.questionOptions.questionId, questionId));
              const correctOptionIds = new Set(
                currentOptions.filter((o) => o.isCorrect).map((o) => o.id)
              );
              const correctOptionTexts = new Set(
                currentOptions.filter((o) => o.isCorrect).map((o) => o.optionText.trim().toLowerCase())
              );

              for (const ans of allStudentAnswers) {
                let isCorrect = false;
                if (ans.selectedOptionId && correctOptionIds.has(ans.selectedOptionId)) {
                  isCorrect = true;
                } else if (ans.answerText && correctOptionTexts.has(ans.answerText.trim().toLowerCase())) {
                  isCorrect = true;
                }
                const scoreVal = isCorrect ? questionPoints : 0;
                if (Boolean(ans.isCorrect) !== isCorrect || Number(ans.score) !== scoreVal) {
                  await tx
                    .update(schema.studentAnswers)
                    .set({
                      isCorrect,
                      score: scoreVal.toString(),
                      updatedAt: new Date(),
                    })
                    .where(eq(schema.studentAnswers.id, ans.id));
                  if (ans.attemptId) affectedAttemptIds.add(ans.attemptId);
                }
              }
            } else if (updatedQ.type === 'true_false') {
              const correctAnsText = (updatedQ.correctAnswer || 'true').trim().toLowerCase();
              for (const ans of allStudentAnswers) {
                const studentAnsText = (ans.answerText || '').trim().toLowerCase();
                const isCorrect = studentAnsText === correctAnsText && studentAnsText !== '';
                const scoreVal = isCorrect ? questionPoints : 0;
                if (Boolean(ans.isCorrect) !== isCorrect || Number(ans.score) !== scoreVal) {
                  await tx
                    .update(schema.studentAnswers)
                    .set({
                      isCorrect,
                      score: scoreVal.toString(),
                      updatedAt: new Date(),
                    })
                    .where(eq(schema.studentAnswers.id, ans.id));
                  if (ans.attemptId) affectedAttemptIds.add(ans.attemptId);
                }
              }
            }

            for (const attemptId of affectedAttemptIds) {
              const attemptAnswers = await tx
                .select()
                .from(schema.studentAnswers)
                .where(eq(schema.studentAnswers.attemptId, attemptId));
              const newTotalScore = attemptAnswers.reduce(
                (sum, a) => sum + (Number(a.score) || 0),
                0
              );
              await tx
                .update(schema.quizAttempts)
                .set({
                  totalScore: newTotalScore.toString(),
                  updatedAt: new Date(),
                })
                .where(eq(schema.quizAttempts.id, attemptId));
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while updating the question' },
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
    const { quizId, questionId } = await params;
    const { error, question } = await checkTeacherAndQuestion(quizId, questionId);
    if (error) return error;
    if (!question) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    await db.transaction(async (tx) => {
      // 1. Find and delete all student answers (and associated essay reviews) for this question
      const answers = await tx
        .select({ id: schema.studentAnswers.id })
        .from(schema.studentAnswers)
        .where(eq(schema.studentAnswers.questionId, questionId));

      if (answers.length > 0) {
        const answerIds = answers.map((a) => a.id);
        await tx
          .delete(schema.essayReviews)
          .where(inArray(schema.essayReviews.studentAnswerId, answerIds));

        await tx
          .delete(schema.studentAnswers)
          .where(inArray(schema.studentAnswers.id, answerIds));
      }

      // 2. Delete all question options for this question
      await tx
        .delete(schema.questionOptions)
        .where(eq(schema.questionOptions.questionId, questionId));

      // 3. Delete the question itself
      await tx
        .delete(schema.questions)
        .where(and(eq(schema.questions.id, questionId), eq(schema.questions.quizId, quizId)));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred while deleting the question' },
      { status: 500 }
    );
  }
}

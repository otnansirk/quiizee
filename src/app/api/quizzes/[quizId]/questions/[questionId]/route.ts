import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{
    quizId: string;
    questionId: string;
  }>;
}

interface OptionInput {
  optionText?: string;
  isCorrect?: boolean;
  order?: number;
}

async function checkTeacherAndQuestion(quizId: string, questionId: string) {
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
  try {
    const { quizId, questionId } = await params;
    const { error, question } = await checkTeacherAndQuestion(quizId, questionId);
    if (error) return error;
    if (!question) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    const body = await req.json();
    const {
      type,
      questionText,
      questionImage,
      duration,
      points,
      order,
      correctAnswer,
      options,
    } = body;

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
      if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer !== null ? String(correctAnswer) : null;

      await tx
        .update(schema.questions)
        .set(updateData)
        .where(eq(schema.questions.id, questionId));

      const effectiveType = type !== undefined ? type : question.type;

      if (effectiveType === 'multiple_choice' && Array.isArray(options)) {
        await tx
          .delete(schema.questionOptions)
          .where(eq(schema.questionOptions.questionId, questionId));

        if (options.length > 0) {
          const optionsToInsert = (options as OptionInput[]).map((opt, idx) => ({
            questionId,
            optionText: String(opt.optionText || '').trim(),
            isCorrect: Boolean(opt.isCorrect),
            order: opt.order !== undefined && opt.order !== null ? Number(opt.order) : idx + 1,
          }));

          await tx
            .insert(schema.questionOptions)
            .values(optionsToInsert);
        }
      } else if (type !== undefined && type !== 'multiple_choice' && question.type === 'multiple_choice') {
        await tx
          .delete(schema.questionOptions)
          .where(eq(schema.questionOptions.questionId, questionId));
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

import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { essayReviews } from './essay-reviews';
import { questionOptions } from './question-options';
import { questions } from './questions';
import { quizAttempts } from './quiz-attempts';

/**
 * Answer status enum: viewing, answered, or timed_out.
 */
export const answerStatusEnum = pgEnum('answer_status', [
  'viewing',
  'answered',
  'timed_out',
]);

/**
 * Student answers table storing responses for each question within a quiz attempt.
 */
export const studentAnswers = pgTable('student_answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  attemptId: uuid('attempt_id')
    .notNull()
    .references(() => quizAttempts.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id),
  selectedOptionId: uuid('selected_option_id').references(() => questionOptions.id),
  answerText: text('answer_text'),
  isCorrect: boolean('is_correct'),
  score: decimal('score', { precision: 10, scale: 2 }),
  questionStartedAt: timestamp('question_started_at').notNull(),
  questionEndedAt: timestamp('question_ended_at'),
  status: answerStatusEnum('status').notNull().default('viewing'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Relations for the student_answers table.
 */
export const studentAnswersRelations = relations(studentAnswers, ({ one, many }) => ({
  attempt: one(quizAttempts, {
    fields: [studentAnswers.attemptId],
    references: [quizAttempts.id],
  }),
  question: one(questions, {
    fields: [studentAnswers.questionId],
    references: [questions.id],
  }),
  selectedOption: one(questionOptions, {
    fields: [studentAnswers.selectedOptionId],
    references: [questionOptions.id],
  }),
  essayReviews: many(essayReviews),
}));

export type StudentAnswer = typeof studentAnswers.$inferSelect;
export type NewStudentAnswer = typeof studentAnswers.$inferInsert;

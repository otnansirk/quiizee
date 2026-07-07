import { relations } from 'drizzle-orm';
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { questionOptions } from './question-options';
import { quizzes } from './quizzes';
import { studentAnswers } from './student-answers';

/**
 * Question types enum: multiple_choice, true_false, or essay.
 */
export const questionTypeEnum = pgEnum('question_type', [
  'multiple_choice',
  'true_false',
  'essay',
]);

/**
 * Questions table storing individual questions belonging to a quiz.
 */
export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  quizId: uuid('quiz_id')
    .notNull()
    .references(() => quizzes.id, { onDelete: 'cascade' }),
  type: questionTypeEnum('type').notNull(),
  questionText: text('question_text').notNull(),
  questionImage: varchar('question_image', { length: 255 }),
  duration: integer('duration'),
  points: integer('points').notNull().default(1),
  order: integer('order').notNull(),
  correctAnswer: text('correct_answer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Relations for the questions table.
 */
export const questionsRelations = relations(questions, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
  options: many(questionOptions),
  studentAnswers: many(studentAnswers),
}));

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { questions } from './questions';
import { studentAnswers } from './student-answers';

/**
 * Question options table storing choices for multiple choice questions.
 */
export const questionOptions = pgTable('question_options', {
  id: uuid('id').defaultRandom().primaryKey(),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  optionText: text('option_text').notNull(),
  isCorrect: boolean('is_correct').notNull().default(false),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Relations for the question_options table.
 */
export const questionOptionsRelations = relations(questionOptions, ({ one, many }) => ({
  question: one(questions, {
    fields: [questionOptions.questionId],
    references: [questions.id],
  }),
  studentAnswers: many(studentAnswers),
}));

export type QuestionOption = typeof questionOptions.$inferSelect;
export type NewQuestionOption = typeof questionOptions.$inferInsert;

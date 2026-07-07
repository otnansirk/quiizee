import { relations } from 'drizzle-orm';
import { decimal, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { studentAnswers } from './student-answers';
import { users } from './users';

/**
 * Essay reviews table storing teacher feedback and scores for essay questions.
 */
export const essayReviews = pgTable('essay_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentAnswerId: uuid('student_answer_id')
    .notNull()
    .references(() => studentAnswers.id, { onDelete: 'cascade' }),
  teacherId: uuid('teacher_id')
    .notNull()
    .references(() => users.id),
  score: decimal('score', { precision: 10, scale: 2 }).notNull(),
  feedback: text('feedback'),
  reviewedAt: timestamp('reviewed_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Relations for the essay_reviews table.
 */
export const essayReviewsRelations = relations(essayReviews, ({ one }) => ({
  studentAnswer: one(studentAnswers, {
    fields: [essayReviews.studentAnswerId],
    references: [studentAnswers.id],
  }),
  teacher: one(users, {
    fields: [essayReviews.teacherId],
    references: [users.id],
  }),
}));

export type EssayReview = typeof essayReviews.$inferSelect;
export type NewEssayReview = typeof essayReviews.$inferInsert;

import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { participants } from './participants';
import { quizzes } from './quizzes';
import { studentAnswers } from './student-answers';
import { users } from './users';

/**
 * Attempt status enum: in_progress, submitted, or graded.
 */
export const attemptStatusEnum = pgEnum('attempt_status', [
  'in_progress',
  'submitted',
  'graded',
]);

/**
 * Quiz attempts table recording user/participant quiz sessions and scores.
 * 
 * NOTE: CHECK constraint note:
 * Either userId or participantId must be set (one of them must be non-null depending on public/private quiz mode).
 * In SQL: CONSTRAINT check_user_or_participant CHECK (
 *   (user_id IS NOT NULL AND participant_id IS NULL) OR
 *   (user_id IS NULL AND participant_id IS NOT NULL)
 * )
 */
export const quizAttempts = pgTable('quiz_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  quizId: uuid('quiz_id')
    .notNull()
    .references(() => quizzes.id),
  // NOTE: CHECK constraint - either userId or participantId must be set
  userId: uuid('user_id').references(() => users.id),
  // NOTE: CHECK constraint - either userId or participantId must be set
  participantId: uuid('participant_id').references(() => participants.id),
  resultCode: varchar('result_code', { length: 20 }).notNull().unique(),
  attemptNumber: integer('attempt_number').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  totalScore: decimal('total_score', { precision: 10, scale: 2 }),
  maxScore: decimal('max_score', { precision: 10, scale: 2 }).notNull(),
  status: attemptStatusEnum('status').notNull().default('in_progress'),
  isAutoSubmitted: boolean('is_auto_submitted').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Relations for the quiz_attempts table.
 */
export const quizAttemptsRelations = relations(quizAttempts, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id],
  }),
  participant: one(participants, {
    fields: [quizAttempts.participantId],
    references: [participants.id],
  }),
  studentAnswers: many(studentAnswers),
}));

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type NewQuizAttempt = typeof quizAttempts.$inferInsert;

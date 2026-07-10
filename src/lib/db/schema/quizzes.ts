import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { participants } from './participants';
import { questions } from './questions';
import { quizAttempts } from './quiz-attempts';
import { users } from './users';

/**
 * Access mode enum for quizzes: public or private.
 */
export const accessModeEnum = pgEnum('access_mode', ['public', 'private']);

/**
 * Duration mode enum for quizzes: global timer or per-question timer.
 */
export const durationModeEnum = pgEnum('duration_mode', ['global', 'per_question']);

/**
 * Quizzes table storing quiz configuration, access rules, and publication state.
 */
export const quizzes = pgTable('quizzes', {
  id: uuid('id').defaultRandom().primaryKey(),
  teacherId: uuid('teacher_id')
    .notNull()
    .references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  accessCode: varchar('access_code', { length: 20 }).notNull().unique(),
  accessMode: accessModeEnum('access_mode').notNull().default('public'),
  durationMode: durationModeEnum('duration_mode').notNull(),
  globalDuration: integer('global_duration'),
  maxAttempts: integer('max_attempts').notNull().default(1),
  certificateEnabled: boolean('certificate_enabled').notNull().default(false),
  certificateMinScore: integer('certificate_min_score'),
  certificateSignerName: varchar('certificate_signer_name', { length: 255 }),
  certificateSignerRole: varchar('certificate_signer_role', { length: 255 }),
  certificateSignatureUrl: varchar('certificate_signature_url', { length: 1024 }),
  isPublished: boolean('is_published').notNull().default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Relations for the quizzes table.
 */
export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  teacher: one(users, {
    fields: [quizzes.teacherId],
    references: [users.id],
  }),
  participants: many(participants),
  questions: many(questions),
  quizAttempts: many(quizAttempts),
}));

export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;

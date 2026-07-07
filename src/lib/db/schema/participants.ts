import { relations } from 'drizzle-orm';
import { pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { quizAttempts } from './quiz-attempts';
import { quizzes } from './quizzes';

/**
 * Participants table storing information for public quiz takers (no login required).
 */
export const participants = pgTable(
  'participants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    quizId: uuid('quiz_id')
      .notNull()
      .references(() => quizzes.id),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueQuizEmail: unique('participants_quiz_id_email_unique').on(
      table.quizId,
      table.email
    ),
  })
);

/**
 * Relations for the participants table.
 */
export const participantsRelations = relations(participants, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [participants.quizId],
    references: [quizzes.id],
  }),
  quizAttempts: many(quizAttempts),
}));

export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;

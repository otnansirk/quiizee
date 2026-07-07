import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { essayReviews } from './essay-reviews';
import { quizAttempts } from './quiz-attempts';
import { quizzes } from './quizzes';

/**
 * User roles enum: teacher or student.
 */
export const userRoleEnum = pgEnum('user_role', ['teacher', 'student']);

/**
 * Users table storing authentication and profile information.
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  avatar: varchar('avatar', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Relations for the users table.
 */
export const usersRelations = relations(users, ({ many }) => ({
  quizzes: many(quizzes),
  quizAttempts: many(quizAttempts),
  essayReviews: many(essayReviews),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

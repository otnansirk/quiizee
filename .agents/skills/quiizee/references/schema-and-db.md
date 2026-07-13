# Quiizee Database Schema & Drizzle ORM

The application uses **PostgreSQL** (hosted on Supabase) managed with **Drizzle ORM** (`drizzle-orm/postgres-js`). All schema definitions are modularized under `src/lib/db/schema/` and exported via `index.ts`.

---

## Core Tables Breakdown

### 1. `users` (`src/lib/db/schema/users.ts`)
Stores authenticated users (primarily teachers and registered system users).
- `id`: UUID (Primary Key, default `gen_random_uuid()`)
- `name`: Varchar(255)
- `email`: Varchar(255) (Unique)
- `password`: Varchar(255) (Bcrypt hashed)
- `role`: Varchar(50) (`'teacher' | 'student'`, default `'teacher'`)
- `avatar`: Varchar(500)
- `created_at`, `updated_at`: Timestamps

### 2. `quizzes` (`src/lib/db/schema/quizzes.ts`)
Stores main quiz metadata, rules, timer configurations, and certificate settings.
- `id`: UUID (Primary Key)
- `teacher_id`: UUID (Foreign Key -> `users.id`, Cascade Delete)
- `title`: Varchar(255)
- `description`: Text
- `access_code`: Varchar(50) (Optional code required to join)
- `access_mode`: Varchar(50) (`'public' | 'code' | 'email'`)
- `allowed_emails`: Text (JSON string array or comma-separated emails allowed when `access_mode === 'email'`)
- `can_resume`: Boolean (Whether student can close browser and resume active attempt)
- `expires_at`: Timestamp (Quiz deadline)
- `duration_mode`: Varchar(50) (`'global'` for entire quiz, `'per_question'` for individual question countdowns, `'unlimited'`)
- `global_duration`: Integer (Seconds allocated if `duration_mode === 'global'`)
- `max_attempts`: Integer (How many times a participant can attempt)
- `is_published`: Boolean (Must be true for students to attempt)
- `certificate_enabled`, `certificate_min_score`, `certificate_signer_name`, `certificate_signer_role`: Certificate generation rules

### 3. `questions` (`src/lib/db/schema/questions.ts`)
Stores individual questions belonging to a quiz.
- `id`: UUID (Primary Key)
- `quiz_id`: UUID (Foreign Key -> `quizzes.id`, Cascade Delete)
- `question_text`: Text (Supports markdown and fenced code blocks ` ```lang...``` `)
- `question_image`: Varchar(500) (Optional image attachment URL)
- `type`: Varchar(50) (`'multiple_choice' | 'true_false' | 'essay'`)
- `points`: Integer (Weight/score of the question)
- `duration`: Integer (Seconds allocated if `quizzes.duration_mode === 'per_question'`)
- `order`: Integer (Sequence index 0, 1, 2...)
- `correct_answer`: Text (Used for `'true_false'` (`'true' | 'false'`) or direct exact string checks)

### 4. `question_options` (`src/lib/db/schema/question-options.ts`)
Stores choices for `'multiple_choice'` questions.
- `id`: UUID (Primary Key)
- `question_id`: UUID (Foreign Key -> `questions.id`, Cascade Delete)
- `option_text`: Text (Supports inline code/formatting)
- `is_correct`: Boolean
- `order`: Integer

### 5. `participants` (`src/lib/db/schema/participants.ts`)
Stores student/candidate profiles taking a quiz.
- `id`: UUID (Primary Key)
- `email`: Varchar(255)
- `name`: Varchar(255)
- `user_id`: UUID (Optional link if student has an account)

### 6. `quiz_attempts` (`src/lib/db/schema/quiz-attempts.ts`)
Tracks an active or completed exam session by a participant.
- `id`: UUID (Primary Key)
- `quiz_id`: UUID (Foreign Key -> `quizzes.id`)
- `participant_id`: UUID (Foreign Key -> `participants.id`)
- `status`: Varchar(50) (`'in_progress' | 'submitted' | 'timed_out' | 'graded'`)
- `started_at`, `submitted_at`: Timestamps
- `total_score`: Integer (Sum of earned points)
- `max_score`: Integer (Total possible points across all questions)
- `result_code`: Varchar(100) (Unique public scorecard access token for `/results/[resultCode]`)
- `current_question_index`: Integer (Used for `can_resume` state tracking)

### 7. `student_answers` (`src/lib/db/schema/student-answers.ts`)
Stores student responses per question during an attempt.
- `id`: UUID (Primary Key)
- `attempt_id`: UUID (Foreign Key -> `quiz_attempts.id`, Cascade Delete)
- `question_id`: UUID (Foreign Key -> `questions.id`)
- `selected_option_id`: UUID (Foreign Key -> `question_options.id`, used if `multiple_choice`)
- `answer_text`: Text (Used for `true_false` string value or `essay` written response)
- `is_correct`: Boolean (Auto-calculated for `multiple_choice` and `true_false`; null initially for `essay`)
- `score`: Numeric/Integer (Points awarded)
- `started_at`, `answered_at`: Timestamps (Tracked for per-question timer mode)

### 8. `essay_reviews` (`src/lib/db/schema/essay-reviews.ts`)
Tracks teacher manual grading and feedback on `essay` questions.
- `id`: UUID (Primary Key)
- `answer_id`: UUID (Foreign Key -> `student_answers.id`, Cascade Delete)
- `reviewer_id`: UUID (Foreign Key -> `users.id`)
- `score`: Numeric/Integer (Points assigned by instructor)
- `feedback`: Text (Instructor comments shown on student scorecard)
- `reviewed_at`: Timestamp

---

## Drizzle Commands & Database Workflow

- **`npm run db:push`** (`drizzle-kit push`): Directly syncs schema changes from `src/lib/db/schema/*` into the remote Postgres database defined by `process.env.DATABASE_URL`. Use this during development when adding columns or tables.
- **`npm run db:studio`** (`drizzle-kit studio`): Launches a visual web interface to browse records, test queries, and debug data in local or remote Postgres.
- **`npm run db:generate`** (`drizzle-kit generate`): Generates SQL migration files (`0000_snapshot.json`, `.sql`) inside `src/lib/db/migrations/`.

### Drizzle Query Best Practices in Quiizee
When querying via `getDb()`:
```ts
import { getDb } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const db = getDb();

// Example: Fetch quiz with all questions and options ordered correctly
const quizData = await db.query.quizzes.findFirst({
  where: eq(schema.quizzes.id, quizId),
  with: {
    questions: {
      orderBy: [schema.questions.order],
      with: {
        options: {
          orderBy: [schema.questionOptions.order],
        },
      },
    },
  },
});
```

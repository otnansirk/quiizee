# Quiizee Architecture & Core Features

## Technology Stack Overview

- **Framework**: Next.js 16.2.10 (App Router, Turbopack enabled by default for fast development builds)
- **Edge Runtime / Hosting**: Cloudflare Workers executed via `@opennextjs/cloudflare` (`open-next.config.ts`)
- **Database**: PostgreSQL on Supabase (`postgres-js` driver `^3.4.9` wrapped with Drizzle ORM `^0.45.2`)
- **Connection Pooling & Cache**: Cloudflare Hyperdrive (`env.HYPERDRIVE`) in production + Supabase Supavisor (`aws-1-ap-southeast-1.pooler.supabase.com:6543`) in local dev
- **Authentication**: NextAuth.js v5 Beta (`next-auth@^5.0.0-beta.31`) with custom Drizzle/Postgres authorization and credentials provider
- **AI Engine**: Google Gemini API (`GEMINI_API_KEY`, `GEMINI_API_URL`) integrated for automated quiz question generation from teacher prompts or study materials
- **Styling**: TailwindCSS v3 (`tailwind.config.ts`) + Vanilla CSS design tokens (`src/app/globals.css` / `index.css`) with glassmorphism, rich dark mode, and dynamic micro-animations

---

## Codebase Directory Structure

```text
src/
├── app/
│   ├── (dashboard)/
│   │   └── teacher/             # Teacher Dashboard Routes (Protected by Auth)
│   │       ├── quizzes/         # Quiz management, create, edit, question list & order
│   │       │   ├── new/         # Create quiz form
│   │       │   └── [quizId]/
│   │       │       ├── edit/    # Edit quiz configuration (timer, access mode, etc.)
│   │       │       └── questions/ # Question management (reorder, add, AI generate)
│   │       └── reviews/         # Manual grading workflows for student essay responses
│   │           └── [attemptId]/ # Detailed grading interface with score & feedback inputs
│   ├── api/                     # Backend Route Handlers (Next.js App Router API)
│   │   ├── ai/
│   │   │   └── generate-questions/ # POST handler calling Google Gemini API to build questions
│   │   ├── attempts/            # Quiz attempt lifecycle endpoints
│   │   │   └── [attemptId]/
│   │   │       ├── answer/      # Save answer choice / essay response (auto-save)
│   │   │       ├── finalize/    # Finalize attempt calculation upon timeout/completion
│   │   │       ├── question-start/ # Record per-question timer start timestamp
│   │   │       ├── review/      # Teacher grading submission API
│   │   │       └── submit/      # Student final quiz submission
│   │   ├── quizzes/             # Public/student quiz join & question lookup APIs
│   │   │   └── join/            # Access code / participant verification
│   │   └── teacher/             # Teacher administrative endpoints
│   ├── quiz/
│   │   └── [attemptId]/         # Student Quiz Attempt Interface (Interactive Timer, Question Display)
│   └── results/
│       └── [resultCode]/        # Public & Student Result View (Scorecard, Correct/Incorrect breakdown)
├── components/
│   ├── atoms/                   # Reusable atomic UI elements
│   │   ├── BrandLogo.tsx        # Styled application logo
│   │   ├── FormattedText.tsx    # Critical markdown/fenced code block renderer with copy buttons
│   │   ├── ModalPortal.tsx      # React portal wrapper for modals
│   │   └── Spinner.tsx          # Loading state indicator
│   ├── features/                # Domain-specific feature components
│   │   ├── ai/                  # AI Question generation modal & configuration
│   │   ├── questions/           # Teacher question form, card item, list, delete & publish modals
│   │   ├── quiz-attempt/        # Student quiz header timer, interactive display, sidebar nav
│   │   ├── quizzes/             # Quiz cards, edit header banner, settings form
│   │   ├── results/             # Result header banner, detailed question comparison item
│   │   └── reviews/             # Teacher grading header, interactive review question card
│   ├── molecules/               # Composite UI blocks
│   └── organisms/               # Page-level composite sections
└── lib/
    ├── auth.ts                  # NextAuth configuration, JWT callbacks, authorize() db lookup
    └── db/
        ├── index.ts             # getDb() factory (Cloudflare Hyperdrive / local pooler resolution)
        ├── migrations/          # Drizzle SQL migration artifacts & metadata
        └── schema/              # Drizzle ORM table definitions & relation setups
```

---

## Authentication & Role-Based Access Control

Quiizee implements two core roles in the `users` table (`role: 'teacher' | 'student'`):

1. **Teacher Role (`teacher`)**:
   - Has full access to `/teacher/*` routes (`/teacher/quizzes`, `/teacher/reviews`).
   - Can create, edit, delete, publish quizzes, configure access codes (`access_mode: 'public' | 'code' | 'email'`), set timer modes (`duration_mode: 'global' | 'per_question'`), and trigger AI question generation.
   - Responsible for reviewing and grading student `essay` responses (`/teacher/reviews/[attemptId]`).

2. **Student Role (`student` / Participant)**:
   - Joins quizzes via public link, access code (`join/route.ts`), or email verification (`allowed_emails`).
   - Executes quiz attempts in `/quiz/[attemptId]`. Answers are auto-saved (`/api/attempts/[attemptId]/answer`) as they interact with multiple choice, true/false, or essay inputs.
   - Views final or pending scores in `/results/[resultCode]`.

### NextAuth Setup (`src/lib/auth.ts`)
- Configured with `CredentialsProvider` that checks email/password against bcrypt (`bcryptjs.compare`) inside `db.select().from(users).where(eq(users.email, email))`.
- Session and token callbacks (`jwt()`, `session()`) attach `user.id`, `user.role`, and `user.name` into the active Next.js session object for secure route authorization.

---

## AI Question Generation Engine (`src/app/api/ai/generate-questions/route.ts`)

Teachers can use Google Gemini (`GEMINI_API_KEY`) to instantly draft high-quality quiz questions:
- **Input Parameters**: Topic prompt, target question count, difficulty level, and desired question types (Multiple Choice, True/False, Essay).
- **Processing**: Sends a structured JSON prompt to Gemini Flash / Pro (`GEMINI_API_URL`), instructing the model to output strict JSON array structures containing `questionText`, `points`, `options`, and `correctAnswer`.
- **Formatting Support**: The AI prompt encourages rich markdown code snippets inside `questionText` when generating programming or technical assessment items, which are seamlessly displayed via `FormattedText.tsx`.

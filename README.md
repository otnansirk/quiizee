# Quiizee (Mini LMS)

**Quiizee** is a modern, AI-powered Learning Management System (Mini LMS) tailored for dynamic quiz creation, automated scoring, and interactive online assessments. Built with **Next.js 16**, **Drizzle ORM**, and **Supabase PostgreSQL**, and optimized for serverless edge deployment on **Cloudflare Workers** using **Hyperdrive**.

---

## ✨ Features

- **Teacher Dashboard**: Create, edit, reorder, and publish quizzes with custom time limits, access codes, and certificate settings.
- **AI Question Generation**: Automatically draft multiple choice, true/false, and essay questions with code formatting using **Google Gemini AI**.
- **Interactive Student Attempts**: Seamless quiz-taking interface with per-question or global timers, auto-saving responses, and instant grading.
- **Essay Review Workflow**: Dedicated teacher grading workspace for evaluating written responses and leaving feedback.
- **Rich Markdown & Code Rendering**: Built-in support for syntax highlighted code blocks (` ``` `) and inline formatting across all question cards.

---

## 🚀 How to Run Locally

### 1. Prerequisites
- **Node.js**: `v20` or higher (`v24` recommended)
- **Database**: A PostgreSQL database (e.g., [Supabase](https://supabase.com))

### 2. Installation & Environment Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy the example environment file and fill in your values:
   ```bash
   cp .env.example .env
   ```
   *Make sure your `DATABASE_URL` in `.env` points to your Supabase **Connection Pooler URL (`aws-0-...pooler.supabase.com:6543`) over IPv4** to avoid local `ENETUNREACH` IPv6 errors.*

### 3. Database Migration

Push the Drizzle ORM schema to your database to create the required tables:
```bash
npm run db:push
```

### 4. Start Development Server

Run the Next.js dev server (powered by Turbopack):
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🛠️ Key Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local development server with Turbopack on `http://localhost:3000`. |
| `npm run build` | Builds the application locally for verification. |
| `npm run preview` | Compiles and previews the Cloudflare Worker locally via Miniflare. |
| `npm run db:push` | Syncs Drizzle ORM schema directly to the database. |
| `npm run db:studio` | Opens a visual web interface (`Drizzle Studio`) to inspect database tables. |

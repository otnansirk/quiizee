---
name: quiizee
description: Comprehensive knowledge base, architecture guide, database schema, and deployment patterns for Quiizee (Mini LMS) — an AI-powered quiz and assessment platform built with Next.js 16, OpenNext Cloudflare Workers, Drizzle ORM, Supabase Postgres, and Cloudflare Hyperdrive. Load when developing, debugging, optimizing, or deploying any part of the Quiizee codebase.
---

# Quiizee (Mini LMS) - Agent Knowledge Base

Quiizee is an enterprise-grade AI-powered Learning Management System (Mini LMS) specialized in dynamic quiz creation, automated assessment, interactive student attempts, and essay review workflows. It is engineered to run serverlessly on **Cloudflare Workers** using **OpenNext (`@opennextjs/cloudflare`)**, connected to a **Supabase PostgreSQL** database via **Cloudflare Hyperdrive** for ultra-low latency connection pooling and query caching.

## Quick Reference & Modular Documentation

When working on specific parts of the codebase, consult the detailed reference files inside `@.agents/skills/quiizee/references/`:

- **[Architecture & Core Features](./references/architecture.md)**: Tech stack, directory layout, role-based access (Teacher/Student), NextAuth v5 Beta (`src/lib/auth.ts`), and Gemini AI question generation.
- **[Database Schema & Drizzle ORM](./references/schema-and-db.md)**: Detailed breakdown of the 8 core tables (`users`, `quizzes`, `questions`, `question-options`, `quiz-attempts`, `student-answers`, `essay-reviews`, `participants`), migration commands (`npm run db:push`), and Drizzle query patterns.
- **[Hyperdrive & Wrangler Setup](./references/hyperdrive-and-wrangler.md)**: Critical database connection knowledge, IPv4/IPv6 `connect ENETUNREACH` gotchas, Supabase Pooler integration (`localConnectionString` vs edge Hyperdrive), `src/lib/db/index.ts` architecture, and `wrangler.jsonc` / OpenNext commands.
- **[GitHub Actions & CI/CD Pipeline](./references/github-actions.md)**: Automated deployment workflow (`deploy.yml`), OpenNext Cloudflare build steps, dynamic `wrangler secret put` runtime secret injection, and required GitHub repository secrets.

---

## Core Development Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs Next.js 16 Turbopack dev server with increased memory (`--max-old-space-size=4096`). Connects via `localConnectionString` or `DATABASE_URL` over IPv4. |
| `npm run build` | Runs `next build --turbo` for local bundle verification. |
| `npm run preview` | Compiles app via `opennextjs-cloudflare build` and runs Cloudflare Worker locally via Miniflare (`opennextjs-cloudflare preview`). |
| `npm run deploy` | Compiles and deploys live to Cloudflare Workers with `--keep-vars` preserved (`opennextjs-cloudflare deploy`). |
| `npm run db:push` | Pushes Drizzle schema changes directly to Postgres (`drizzle-kit push`) using `DATABASE_URL`. |
| `npm run db:studio` | Opens local Drizzle Studio UI (`drizzle-kit studio`) to inspect and modify database tables. |
| `npm run cf-typegen` | Generates Cloudflare environment interface bindings (`cloudflare-env.d.ts`). |

---

## Key Rules for AI Coding Assistants working on Quiizee

1. **Always Use FormattedText for Question Rendering**: Whenever rendering `questionText` or `optionText` across any component (Attempt, Question List, Results, Review), use the `<FormattedText text={...} />` component (`src/components/atoms/FormattedText.tsx`) to ensure markdown fenced code blocks (` ``` `), syntax headers, copy buttons, and inline formatting render properly.
2. **Never Break Hyperdrive Edge Bindings**: In `src/lib/db/index.ts`, always read `connectionString` from `getCloudflareContext().env.HYPERDRIVE.connectionString` when inside the Cloudflare Worker runtime. Only fall back to `process.env.DATABASE_URL` when in local development (`process.env.NODE_ENV === 'development'`) or when `HYPERDRIVE` is not bound.
3. **Respect Next.js 16 Breaking Changes**: This project runs on **Next.js 16.2.10** (`--turbo`). Heed Next.js 16 conventions (e.g. `proxy` file or Route Handlers over deprecated `middleware`, async `params` and `searchParams` in server components and routes).
4. **Preserve UI Aesthetics**: Quiizee uses rich, premium UI design (`index.css` design tokens, glassmorphism headers, micro-animations, curated color palettes, dark mode code boxes). Avoid generic styling or plain minimum viable layouts.

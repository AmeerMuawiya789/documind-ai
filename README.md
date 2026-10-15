# DocuMind AI

An AI-powered document assistant SaaS. Upload documents (PDF, DOCX, TXT, MD, CSV),
ask questions with cited answers, generate summaries in seven formats, extract
structured data, and compare documents — all grounded in your files, never guessed.

**Stack:** Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS v4 ·
Supabase (PostgreSQL + pgvector, Auth, private Storage) · OpenAI-compatible AI
provider abstraction · Vitest + Playwright.

## Quick start

1. **Prerequisites:** Node.js 20+, a Supabase project, an AI API key
   (any OpenAI-compatible endpoint).
2. **Install:** `npm install`
3. **Configure:** copy `.env.example` to `.env` and fill in the values
   (see [docs/SETUP.md](docs/SETUP.md)).
4. **Database:** run `supabase/migrations/0001_init.sql` and `0002_storage.sql`
   in your Supabase SQL editor (or `supabase db push`).
5. **Run:** `npm run dev` → http://localhost:3000

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E (see [docs/TESTING.md](docs/TESTING.md)) |

## Project structure

```
src/
  app/
    (site)/            Public marketing pages (home, features, pricing, …)
    (auth)/            Sign in / up / password reset
    (app)/             Authenticated app (dashboard, documents, ask, …)
    api/               Route handlers (documents, chat, summarize, extract, …)
    auth/callback/     Supabase auth callback
    sitemap.ts robots.ts
  components/
    ui/                Design-system primitives (button, card, dialog, …)
    site/              Marketing header/footer
    app/               App sidebar, upload dialog
  lib/
    ai/                Provider abstraction, chunking, retrieval, prompts
    documents/         File validation + text extraction
    supabase/          Browser / server / service-role clients
    config.ts          Tiers, pricing, AI config (env-driven)
    usage.ts           Quota checks + usage tracking
    validation.ts      Zod schemas for every API route
    rate-limit.ts      Per-user rate limiting
supabase/migrations/   0001_init.sql (schema + RLS + pgvector) · 0002_storage.sql
tests/unit/            Vitest suites · tests/e2e/ Playwright specs
docs/                  Setup, deployment, AI provider, payments, testing, architecture
```

## Key design decisions

- **Auth is verified server-side.** Middleware refreshes the session and guards
  `/app/*`; the app layout re-validates with `supabase.auth.getUser()`. Client
  checks are UI hints only.
- **Ownership is enforced in Postgres.** Row-level security on every table plus
  storage policies scoped to `<user_id>/…`. The vector-search RPC re-checks
  document ownership inside the database.
- **AI is a swappable server-side provider.** `src/lib/ai/provider.ts` exposes a
  `chat()`/`embed()` interface; the default implementation speaks the OpenAI
  chat-completions + embeddings HTTP API, so any compatible endpoint works.
  Set `DOCUMIND_MOCK_AI=true` for deterministic offline responses (tests/demos).
- **RAG with citations.** Documents are chunked (1200 chars, 200 overlap),
  embedded with pgvector, and retrieved per question. Prompts are versioned
  (`PROMPT_VERSION`) and treat document text as **untrusted data**.
- **Prices and limits are config, not code.** See `src/lib/config.ts` — tiers
  read from environment variables with sane defaults.

## Documentation

- [docs/SETUP.md](docs/SETUP.md) — local development setup
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — deploying to Vercel
- [docs/AI_PROVIDER.md](docs/AI_PROVIDER.md) — configuring the AI provider
- [docs/PAYMENTS.md](docs/PAYMENTS.md) — payments removed; free for everyone
- [docs/TESTING.md](docs/TESTING.md) — running tests
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design notes
- [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) — honest list of what's not done yet

# Local setup

## 1. Prerequisites

- Node.js 20 or newer (`node -v`)
- A Supabase project ([supabase.com](https://supabase.com) → New project)
- An AI API key from any OpenAI-compatible provider
  (or use `DOCUMIND_MOCK_AI=true` to run with deterministic mock responses)

## 2. Install

```bash
cd documind-ai
npm install
```

## 3. Environment variables

```bash
cp .env.example .env
```

Fill in:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` key (**server only**, never expose) |
| `AI_API_KEY` | Your AI provider dashboard |
| `AI_PROVIDER_BASE_URL` | e.g. `https://api.openai.com/v1` (default) |
| `AI_CHAT_MODEL` / `AI_EMBEDDING_MODEL` | Model names your provider supports |

Optional: `NEXT_PUBLIC_APP_URL` (default `http://localhost:3000`),
`MAX_UPLOAD_MB` (default 20), `RATE_LIMIT_PER_MINUTE` (default 30).

## 4. Database

In the Supabase SQL editor, run in order:

1. `supabase/migrations/0001_init.sql` — tables, indexes, pgvector function, RLS
2. `supabase/migrations/0002_storage.sql` — private `documents` bucket + policies

Or with the Supabase CLI linked to your project:

```bash
supabase db push
```

Verify: Table Editor should show `profiles`, `documents`, `document_chunks`,
`conversations`, `messages`, `generated_outputs`, `usage_events`,
`subscriptions`, `payment_events`. Storage should list a **private** bucket
named `documents`.

> **Email verification:** Supabase Auth → Authentication → turn on
> "Confirm email". The sign-up page redirects verification links to
> `/auth/callback`, which is already wired.

## 5. Run

```bash
npm run dev
```

Open http://localhost:3000 — create an account, verify your email, upload a
document, and ask it a question.

## 6. Verify the install

```bash
npm run typecheck   # strict TypeScript
npm run lint        # ESLint
npm test            # 39 unit tests (Vitest)
```

## Troubleshooting

- **"Supabase is not configured"** — `.env` values missing or dev server not
  restarted after editing `.env`.
- **Upload fails with RLS error** — migrations not applied, or the
  `documents` bucket doesn't exist.
- **AI returns 503 "not configured"** — set `AI_API_KEY`, or
  `DOCUMIND_MOCK_AI=true` for offline mode.
- **Vector search returns nothing** — embeddings only generate when the AI
  provider is configured; keyword fallback still works.

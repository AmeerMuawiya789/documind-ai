# Architecture

## Request flow

```
Browser ──▶ Middleware (session refresh, /app guard)
   │ Server Components / Client ──▶ Route Handlers (/api/*)
   │                                     │
   │                                     ├─▶ Supabase (user-scoped, RLS)
   │                                     ├─▶ Supabase Storage (private bucket)
   │                                     └─▶ AI provider (server-side only)
   └────────────────────────────────────────▶ Supabase Auth (cookies)
```

## Data model

- `profiles` (1:1 with `auth.users`) + `subscriptions`
- `documents` → `document_chunks` (pgvector `vector(1536)`, ivfflat index)
- `conversations` → `messages` (sources stored as JSONB)
- `generated_outputs` (summaries, extractions, comparisons as JSONB)
- `usage_events` (per-operation token/cost ledger)
- `payment_events` (Stripe idempotency log)

All user tables have `user_id`, timestamps, and RLS policies restricting
access to the owner. The service-role client is used only for storage
uploads and the extraction pipeline, with ownership enforced by the
`<user_id>/…` path convention.

## RAG pipeline

1. **Upload** → validate (type/size) → private storage → extract text
   (unpdf for PDF, mammoth for DOCX, UTF-8 decode for text)
2. **Chunk** → 1200 chars, 200 overlap, sentence-aware, page numbers kept
3. **Embed** → batched embeddings stored alongside chunks (nullable — keyword
   fallback keeps Q&A working without vectors)
4. **Ask** → embed query → `match_document_chunks()` RPC (ownership checked
   in SQL) → top-6 passages → cited answer or explicit "not enough evidence"

## Security notes

- Document text is **untrusted data**: prompts forbid following embedded
  instructions; secrets never enter prompts.
- No document contents, passwords, tokens, or payment secrets in logs.
- Zod validation on every API input; per-user rate limiting; security
  headers via `next.config.ts`.
- Account deletion cascades in the DB and removes storage objects.

## What to build next (roadmap)

1. Background processing queue for uploads (phase 8 hardening)
2. OCR for scanned PDFs
3. Streaming chat responses
4. Multi-document Q&A
5. Team workspaces (Business tier)
6. Stripe customer portal + proration handling
7. Redis-backed rate limiting
8. Formal accessibility audit

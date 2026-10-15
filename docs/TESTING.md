# Testing

## Unit tests (Vitest)

```bash
npm test          # run once
npm run test:watch # watch mode
```

39 tests cover: text chunking, zod validation schemas, file validation
(type/size), rate limiting, prompt contracts (injection guard, JSON shapes),
evidence formatting, and tier/price configuration.

**Mock AI:** unit tests never hit the network. For integration-style runs,
set `DOCUMIND_MOCK_AI=true` — `getProvider()` returns deterministic
embeddings/answers so chat, summarize, extract and compare routes can be
exercised without a key.

## E2E tests (Playwright)

```bash
npx playwright install   # browsers (one-time)
npm run dev              # terminal 1
npm run test:e2e         # terminal 2
```

`playwright.config.ts` targets Chromium + mobile (Pixel 7). You need a
Supabase project with migrations applied and either a real `AI_API_KEY`
or `DOCUMIND_MOCK_AI=true`.

Suggested E2E scenarios (specs live in `tests/e2e/`):
- Public pages render and navigate (mobile + desktop)
- Sign-up → verify → sign-in → protected `/app/*` redirects when logged out
- Upload valid PDF → `ready`; upload `.exe` → rejected; oversized → rejected
- Ask question → answer contains citation markers; nonsense question on a
  tiny doc → "doesn't contain enough information"
- User A cannot fetch User B's document (API returns 404)
- Delete document → chunks and file gone
- Free-tier quota exceeded → 403 with upgrade message

## RLS verification (manual, recommended before launch)

In the Supabase SQL editor, as two test users:

```sql
-- As user A: should see only A's rows
set role authenticated; set request.jwt.claims.sub = '<user-a-uuid>';
select count(*) from documents;  -- only A's

-- Storage: user A cannot read user B's path (expect 0 rows / denied)
```

## Real integration test (with AI key)

1. `DOCUMIND_MOCK_AI` unset, `AI_API_KEY` set.
2. Upload the sample PDF in `tests/fixtures/` (add your own).
3. Ask 3 questions; confirm citations match the source text.
4. Run a summary + extraction; confirm JSON validity and evidence quotes.
5. Check `usage_events` for token counts.

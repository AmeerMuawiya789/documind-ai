# Known limitations

Honest accounting of what DocuMind AI does not yet do (private-beta scope).
Nothing here is presented as working when it isn't.

## Product
- **No OCR.** Scanned-image PDFs are detected and flagged, but their image
  content can't be read. OCR (e.g. Tesseract/OCRmyPDF pipeline) is roadmap.
- **Extraction is synchronous.** Upload processing happens inside the request.
  Very large documents may hit serverless time limits — a background job queue
  (e.g. Inngest/Trigger.dev) is the planned fix.
- **Single-file uploads only.** No batch/folder upload yet.
- **No document preview rendering.** The viewer shows metadata and actions,
  not an in-browser PDF/DOCX renderer.
- **No team workspaces.** The Business tier advertises "higher configurable
  limits" only — team sharing, roles, and admin controls are not implemented.
- **Contact form uses mailto.** Messages open the visitor's email client;
  there is no ticket backend yet.
- **English-first UI.** The app chrome is English; document Q&A works in the
  document's language via the model.

## AI / retrieval
- **Embeddings optional.** If embedding generation fails, retrieval falls back
  to keyword matching (works, but lower quality). The UI doesn't currently
  surface which mode was used per document.
- **No streaming.** Chat answers arrive whole, not token-by-token.
- **Single-document chat.** Ask is scoped to one document per conversation;
  multi-document Q&A is roadmap.
- **Model choice is global**, via `AI_CHAT_MODEL` — not per user.

## Billing
- **There is none.** DocuMind AI is free for everyone — no plans, no checkout,
  no billing provider code. The owner's OpenRouter key (`AI_API_KEY`) pays for
  every AI call, so the per-user rate limiter is the main abuse protection.

## Operations
- **Rate limiting is in-memory.** Works for a single instance; use Redis for
  multi-instance production.
- **No automated backups configured in-repo.** Follow Supabase's PITR/backup
  guidance in docs/DEPLOYMENT.md before launch.
- **E2E tests need a live Supabase project** and are not run in CI yet.
- **Accessibility:** keyboard navigation and focus states are in place, but no
  formal audit (axe/pa11y) has been run.

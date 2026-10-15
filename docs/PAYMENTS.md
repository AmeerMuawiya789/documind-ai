# Payments

DocuMind AI is **free for everyone**. There are no paid plans, no checkout,
no webhooks, and no billing provider.

- Every feature (questions, summaries, comparisons, extractions) is unlocked
  for all users with no usage limits.
- There is no billing code in the app (`src/app/api/billing` and
  `src/lib/billing` were removed; the Paddle/Stripe history is gone).
- The only remaining cost consideration is the owner's own AI provider bill:
  every AI call is charged to `AI_API_KEY` (OpenRouter), so the per-user
  rate limiter (`RATE_LIMIT_PER_MINUTE`) is the main protection against abuse.

If paid plans are ever reintroduced, this document should be rewritten with
the provider setup, webhook events, and testing steps.

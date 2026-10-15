# AI provider setup

DocuMind AI talks to AI through a small server-side abstraction
(`src/lib/ai/provider.ts`). The default implementation speaks the
**OpenAI chat-completions + embeddings HTTP API**, so any provider with a
compatible endpoint works (OpenAI, Azure OpenAI, OpenRouter, Together,
self-hosted vLLM, …).

## Configuration

| Variable | Purpose | Example |
|---|---|---|
| `AI_PROVIDER_BASE_URL` | Base URL of the API | `https://api.openai.com/v1` |
| `AI_API_KEY` | Secret key (**server only**) | `sk-…` |
| `AI_CHAT_MODEL` | Chat model name | `gpt-4o-mini` |
| `AI_EMBEDDING_MODEL` | Embedding model name | `text-embedding-3-small` |
| `AI_EMBEDDING_DIMENSIONS` | Must match the DB vector size | `1536` |
| `DOCUMIND_MOCK_AI` | `true` → deterministic mock, no network | `false` |

The database stores embeddings as `vector(1536)`. If your embedding model
uses a different dimension, update both `AI_EMBEDDING_DIMENSIONS` and the
migration (`vector(N)` in `0001_init.sql`, plus the RPC signature).

## How it's used

- **Chat** (`/api/chat`): retrieves top-6 passages (pgvector cosine, keyword
  fallback), then calls `chat()` with a versioned system prompt that forces
  citations and an explicit "not enough evidence" response.
- **Embeddings** (`/api/documents/upload`): generated per chunk at upload time.
- **Summaries / extraction / comparison**: single `chat()` calls; extraction
  and comparison use JSON mode and the result is schema-validated before saving.

All calls have a 60s timeout and bounded retries (429/5xx). Failures return
user-friendly errors — never raw provider messages or keys.

## Prompt versioning

System prompts live in `src/lib/ai/prompts.ts` with `PROMPT_VERSION = "v1"`.
Chat responses include the version; bump it when prompts change so behavior
stays traceable.

## Cost monitoring

Every AI call records `usage_events` rows with input/output tokens and a
rough USD estimate (`estimateCostUsd`, rates configurable via
`AI_COST_INPUT_PER_1K` / `AI_COST_OUTPUT_PER_1K`). Query per user:

```sql
select operation, sum(tokens_input + tokens_output) as tokens,
       sum(cost_usd) as usd
from usage_events
where created_at >= date_trunc('month', now())
group by operation;
```

## Swapping providers

Implement the `AIProvider` interface (`chat`, `embed`,
`embeddingDimensions`) and return it from `getProvider()`. No route code
changes needed. Anthropic-style APIs need a small adapter because they don't
expose OpenAI-style embeddings — pair Claude chat with an OpenAI-compatible
embedding endpoint, or extend the interface.

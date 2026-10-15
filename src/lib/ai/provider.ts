import { AI_CONFIG } from "@/lib/config";

/**
 * Provider abstraction — swap models/vendors without rewriting the app.
 * Only ever called from server-side code. Keys never reach the browser.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  /** JSON mode: force the model to reply with valid JSON. */
  jsonMode?: boolean;
}

export interface ChatResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export interface AIProvider {
  readonly name: string;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult>;
  embed(texts: string[]): Promise<number[][]>;
  embeddingDimensions(): number;
}

class OpenAICompatibleProvider implements AIProvider {
  readonly name = "openai-compatible";

  private async request(
    path: string,
    body: unknown,
    attempt = 1,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_CONFIG.requestTimeoutMs);
    try {
      const res = await fetch(`${AI_CONFIG.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AI_CONFIG.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      // Retry on rate limits / transient server errors (bounded).
      if ((res.status === 429 || res.status >= 500) && attempt <= AI_CONFIG.maxRetries) {
        const backoff = Math.min(1000 * 2 ** attempt, 8000);
        await new Promise((r) => setTimeout(r, backoff));
        return this.request(path, body, attempt + 1);
      }
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResult> {
    const res = await this.request("/chat/completions", {
      model: AI_CONFIG.chatModel,
      messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 1500,
      ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
    });
    if (!res.ok) {
      throw new AIError(`Chat request failed (${res.status})`, res.status);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    return {
      text,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    };
  }

  async embed(texts: string[]): Promise<number[][]> {
    const res = await this.request("/embeddings", {
      model: AI_CONFIG.embeddingModel,
      input: texts,
    });
    if (!res.ok) {
      throw new AIError(`Embedding request failed (${res.status})`, res.status);
    }
    const data = (await res.json()) as {
      data?: { embedding?: number[] }[];
    };
    return (data.data ?? []).map((d) => d.embedding ?? []);
  }

  embeddingDimensions(): number {
    return AI_CONFIG.embeddingDimensions;
  }
}

/** Deterministic mock for tests and demos — no network, no key needed. */
class MockProvider implements AIProvider {
  readonly name = "mock";

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResult> {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const text = options.jsonMode
      ? JSON.stringify({ mock: true, note: "mock extraction result" })
      : `Mock answer to: "${(lastUser?.content ?? "").slice(0, 120)}". ` +
        `This is a deterministic test response — no AI call was made.`;
    return { text, inputTokens: 10, outputTokens: 20 };
  }

  async embed(texts: string[]): Promise<number[][]> {
    // Deterministic pseudo-embeddings (hashed) so retrieval tests are stable.
    return texts.map((t) => {
      const v = new Array<number>(AI_CONFIG.embeddingDimensions).fill(0);
      let h = 2166136261;
      for (let i = 0; i < t.length; i++) {
        h ^= t.charCodeAt(i);
        h = Math.imul(h, 16777619);
        v[i % v.length]! += (h % 1000) / 1000;
      }
      const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
      return v.map((x) => x / norm);
    });
  }

  embeddingDimensions(): number {
    return AI_CONFIG.embeddingDimensions;
  }
}

export class AIError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "AIError";
    this.status = status;
  }
}

let cached: AIProvider | null = null;

/** Server-side only. Throws a friendly error when no provider is configured. */
export function getProvider(): AIProvider {
  if (cached) return cached;
  if (AI_CONFIG.mock) {
    cached = new MockProvider();
    return cached;
  }
  if (!AI_CONFIG.apiKey) {
    throw new AIError(
      "AI is not configured. Set AI_API_KEY (or DOCUMIND_MOCK_AI=true for tests).",
      503,
    );
  }
  cached = new OpenAICompatibleProvider();
  return cached;
}

/** Rough cost estimate in USD (configurable per 1K tokens). */
export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  const inPer1k = Number(process.env.AI_COST_INPUT_PER_1K ?? 0.00015);
  const outPer1k = Number(process.env.AI_COST_OUTPUT_PER_1K ?? 0.0006);
  return (inputTokens / 1000) * inPer1k + (outputTokens / 1000) * outPer1k;
}

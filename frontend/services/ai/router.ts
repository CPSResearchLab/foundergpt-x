/**
 * AI Router
 *
 * Responsibilities:
 *   - Select the best available provider for each request
 *   - Retry transient failures (up to MAX_RETRIES per provider)
 *   - Fallback through the provider chain on hard failures
 *   - Measure and attach latency + token usage to every response
 *   - Return a single unified AIResponse — no provider objects ever leak out
 *
 * Provider priority (highest → lowest):
 *   bedrock → groq → gemini → openrouter → nvidia → claude
 *
 * A provider is skipped if its API key env var is absent, so the chain
 * degrades gracefully in any deployment environment.
 */

import { askGroq } from "./groq";
import { askGemini } from "./gemini";
import { askOpenRouter } from "./openrouter";
import { askNvidia } from "./nvidia";
import { askBedrock } from "./bedrock";
import { askClaude } from "./claude";
import { MODELS } from "./models";
import type { AIProvider, AIRequest, AIResponse } from "./types";

// ─── Configuration ────────────────────────────────────────────────────────────

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 300;

type ProviderFn = (request: AIRequest) => Promise<AIResponse>;

type ProviderConfig = {
  envKey: string;
  handler: ProviderFn;
};

/** Single provider registry used for availability checks and dispatch. */
const PROVIDERS: Record<AIProvider, ProviderConfig> = {
  bedrock: { envKey: "AWS_ACCESS_KEY_ID", handler: askBedrock },
  groq: { envKey: "GROQ_API_KEY", handler: askGroq },
  gemini: { envKey: "GEMINI_API_KEY", handler: askGemini },
  openrouter: { envKey: "OPENROUTER_API_KEY", handler: askOpenRouter },
  nvidia: { envKey: "NVIDIA_API_KEY", handler: askNvidia },
  claude: { envKey: "AWS_ACCESS_KEY_ID", handler: askClaude },
};

const DEFAULT_PROVIDER: AIProvider = "bedrock";

/** Default fallback chain, with Bedrock as the default provider. */
const DEFAULT_CHAIN: AIProvider[] = [
  DEFAULT_PROVIDER,
  "groq",
  "gemini",
  "openrouter",
  "nvidia",
  "claude",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAvailable(provider: AIProvider): boolean {
  return Boolean(process.env[PROVIDERS[provider].envKey]);
}

function isTransient(error: string): boolean {
  return /rate.?limit|429|503|timeout|network|econnreset|socket/i.test(error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callWithRetry(provider: AIProvider, request: AIRequest): Promise<AIResponse> {
  const fn = PROVIDERS[provider].handler;
  const providerRequest =
    provider === "bedrock" && !request.model
      ? { ...request, model: MODELS.bedrock.default }
      : request;
  let lastResponse: AIResponse | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAY_MS * attempt);

    const response = await fn(providerRequest);

    if (response.success) return response;

    lastResponse = response;

    // Only retry on transient errors
    if (!isTransient(response.error ?? "")) break;
  }

  return lastResponse!;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Route an AI request through the best available provider.
 *
 * If `request.provider` is set, that provider is tried first (with retries),
 * then the remaining chain is used as fallback.
 *
 * Always returns a unified AIResponse. Never throws.
 */
export async function askAI(request: AIRequest): Promise<AIResponse> {
  const preferred = request.provider ?? DEFAULT_PROVIDER;

  // Build the ordered chain: selected provider first, then the configured fallbacks.
  const chain: AIProvider[] = [preferred, ...DEFAULT_CHAIN.filter((p) => p !== preferred)];

  const available = chain.filter(isAvailable);

  if (available.length === 0) {
    return {
      success: false,
      provider: DEFAULT_PROVIDER,
      model: "none",
      text: "",
      latencyMs: 0,
      error: "No AI provider is configured. Set at least one provider API key.",
    };
  }

  let lastResponse: AIResponse | undefined;

  for (const provider of available) {
    const response = await callWithRetry(provider, request);

    if (response.success) {
      logRouterDecision(provider, response, lastResponse?.provider);
      return response;
    }

    console.warn(`[ai-router] ${provider} failed (${response.error ?? "unknown"}), trying next provider.`);
    lastResponse = response;
  }

  // All providers exhausted
  return {
    ...(lastResponse!),
    success: false,
    error: `All providers failed. Last error from ${lastResponse!.provider}: ${lastResponse!.error}`,
  };
}

function logRouterDecision(
  selected: AIProvider,
  response: AIResponse,
  fallbackFrom?: AIProvider,
): void {
  const msg = fallbackFrom
    ? `[ai-router] fell back from ${fallbackFrom} → ${selected}`
    : `[ai-router] selected ${selected}`;
  console.info(msg, {
    model: response.model,
    latencyMs: response.latencyMs,
    totalTokens: response.usage?.totalTokens,
  });
}

export type AIProvider =
  | "gemini"
  | "groq"
  | "openrouter"
  | "nvidia"
  | "bedrock"
  | "claude";

export interface AIRequest {
  /** Preferred provider. Router will select automatically if omitted. */
  provider?: AIProvider;
  model?: string;
  systemPrompt?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** Unified response — no provider-specific fields ever reach the caller. */
export interface AIResponse {
  success: boolean;
  provider: AIProvider;
  model: string;
  text: string;
  /** Wall-clock milliseconds for the provider call. */
  latencyMs: number;
  /** Token usage reported by the provider (best-effort). */
  usage?: AIUsage;
  error?: string;
}

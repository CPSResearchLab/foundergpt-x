import type { FounderGPTContextInput } from "../memory/foundergpt-context";

export type AIProvider =
  | "gemini"
  | "groq"
  | "openrouter"
  | "nvidia"
  | "bedrock"
  | "claude";

export type AIPreset =
  | "fastChat"
  | "deepResearch"
  | "coding"
  | "businessPlanning"
  | "pitchDeck"
  | "financialAnalysis"
  | "marketing";

export interface AIRequest {
  /** Preferred provider. Router will select automatically if omitted. */
  agent?: string;
  provider?: AIProvider;
  model?: string;
  preset?: AIPreset;
  /** Inputs used by the router to build the structured FounderGPT context. */
  contextInput?: FounderGPTContextInput;
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

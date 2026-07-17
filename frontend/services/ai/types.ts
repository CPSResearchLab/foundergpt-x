export type AIProvider =
  | "gemini"
  | "groq"
  | "openrouter"
  | "nvidia";

export interface AIRequest {
  provider?: AIProvider;
  model?: string;
  systemPrompt?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  success: boolean;
  provider: AIProvider;
  model: string;
  text: string;
  error?: string;
}
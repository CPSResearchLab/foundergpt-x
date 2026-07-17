import { askGroq } from "./groq";
import type { AIRequest, AIResponse } from "./types";

/**
 * Routes requests through the configured default provider. Provider adapters
 * share the AIRequest and AIResponse contracts so fallback support can be
 * added here without changing callers.
 */
export async function askAI(request: AIRequest): Promise<AIResponse> {
  return askGroq(request);
}

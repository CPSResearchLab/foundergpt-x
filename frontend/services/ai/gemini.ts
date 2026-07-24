import { GoogleGenAI } from "@google/genai";
import { MODELS } from "./models";
import type { AIRequest, AIResponse } from "./types";

export async function askGemini(request: AIRequest): Promise<AIResponse> {
  const model = request.model ?? MODELS.gemini.fast;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { success: false, provider: "gemini", model, text: "", latencyMs: 0, error: "GEMINI_API_KEY is not configured." };
  }

  const contents = request.systemPrompt
    ? `${request.systemPrompt}\n\n${request.prompt}`
    : request.prompt;

  const start = Date.now();
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents,
      ...(request.temperature !== undefined || request.maxTokens !== undefined
        ? {
            config: {
              ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
              ...(request.maxTokens !== undefined ? { maxOutputTokens: request.maxTokens } : {}),
            },
          }
        : {}),
    });

    const text = response.text?.trim();
    const latencyMs = Date.now() - start;

    if (!text) {
      return { success: false, provider: "gemini", model, text: "", latencyMs, error: "Gemini returned an empty response." };
    }

    const usage = response.usageMetadata
      ? {
          promptTokens: response.usageMetadata.promptTokenCount ?? 0,
          completionTokens: response.usageMetadata.candidatesTokenCount ?? 0,
          totalTokens: response.usageMetadata.totalTokenCount ?? 0,
        }
      : undefined;

    return { success: true, provider: "gemini", model, text, latencyMs, usage };
  } catch (error: unknown) {
    return {
      success: false,
      provider: "gemini",
      model,
      text: "",
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Gemini request failed.",
    };
  }
}

import OpenAI from "openai";
import { MODELS } from "./models";
import type { AIRequest, AIResponse } from "./types";

export async function askOpenRouter(request: AIRequest): Promise<AIResponse> {
  const model = request.model ?? MODELS.openrouter.default;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return { success: false, provider: "openrouter", model, text: "", latencyMs: 0, error: "OPENROUTER_API_KEY is not configured." };
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: { "HTTP-Referer": "https://foundergpt.ai", "X-Title": "FounderGPT X" },
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    ...(request.systemPrompt ? [{ role: "system" as const, content: request.systemPrompt }] : []),
    { role: "user", content: request.prompt },
  ];

  const start = Date.now();
  try {
    const completion = await client.chat.completions.create({
      model,
      messages,
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      ...(request.maxTokens !== undefined ? { max_tokens: request.maxTokens } : {}),
    });

    const text = completion.choices[0]?.message.content?.trim();
    const latencyMs = Date.now() - start;

    if (!text) {
      return { success: false, provider: "openrouter", model, text: "", latencyMs, error: "OpenRouter returned an empty response." };
    }

    const u = completion.usage;
    const usage = u
      ? { promptTokens: u.prompt_tokens, completionTokens: u.completion_tokens, totalTokens: u.total_tokens }
      : undefined;

    return { success: true, provider: "openrouter", model, text, latencyMs, usage };
  } catch (error: unknown) {
    return {
      success: false,
      provider: "openrouter",
      model,
      text: "",
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "OpenRouter request failed.",
    };
  }
}

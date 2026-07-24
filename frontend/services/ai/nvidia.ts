import OpenAI from "openai";
import { MODELS } from "./models";
import type { AIRequest, AIResponse } from "./types";

export async function askNvidia(request: AIRequest): Promise<AIResponse> {
  const model = request.model ?? MODELS.nvidia.default;
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return { success: false, provider: "nvidia", model, text: "", latencyMs: 0, error: "NVIDIA_API_KEY is not configured." };
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://integrate.api.nvidia.com/v1",
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
      return { success: false, provider: "nvidia", model, text: "", latencyMs, error: "NVIDIA returned an empty response." };
    }

    const u = completion.usage;
    const usage = u
      ? { promptTokens: u.prompt_tokens, completionTokens: u.completion_tokens, totalTokens: u.total_tokens }
      : undefined;

    return { success: true, provider: "nvidia", model, text, latencyMs, usage };
  } catch (error: unknown) {
    return {
      success: false,
      provider: "nvidia",
      model,
      text: "",
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "NVIDIA request failed.",
    };
  }
}

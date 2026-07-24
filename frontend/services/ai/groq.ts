import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { MODELS } from "./models";
import type { AIRequest, AIResponse } from "./types";

export async function askGroq(request: AIRequest): Promise<AIResponse> {
  const model = request.model ?? MODELS.groq.fast;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return { success: false, provider: "groq", model, text: "", latencyMs: 0, error: "GROQ_API_KEY is not configured." };
  }

  const messages: ChatCompletionMessageParam[] = [
    ...(request.systemPrompt ? [{ role: "system" as const, content: request.systemPrompt }] : []),
    { role: "user", content: request.prompt },
  ];

  const start = Date.now();
  try {
    const client = new Groq({ apiKey });
    const completion = await client.chat.completions.create({
      model,
      messages,
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      ...(request.maxTokens !== undefined ? { max_completion_tokens: request.maxTokens } : {}),
    });

    const text = completion.choices[0]?.message.content?.trim();
    const latencyMs = Date.now() - start;

    if (!text) {
      return { success: false, provider: "groq", model, text: "", latencyMs, error: "Groq returned an empty response." };
    }

    const u = completion.usage;
    const usage = u
      ? { promptTokens: u.prompt_tokens, completionTokens: u.completion_tokens, totalTokens: u.total_tokens }
      : undefined;

    return { success: true, provider: "groq", model, text, latencyMs, usage };
  } catch (error: unknown) {
    return {
      success: false,
      provider: "groq",
      model,
      text: "",
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Groq request failed.",
    };
  }
}

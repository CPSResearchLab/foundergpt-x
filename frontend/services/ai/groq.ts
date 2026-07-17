import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

import { MODELS } from "./models";
import type { AIRequest, AIResponse } from "./types";

export async function askGroq(request: AIRequest): Promise<AIResponse> {
  const model = request.model ?? MODELS.groq.fast;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      provider: "groq",
      model,
      text: "",
      error: "GROQ_API_KEY is not configured.",
    };
  }

  const messages: ChatCompletionMessageParam[] = [
    ...(request.systemPrompt ? [{ role: "system" as const, content: request.systemPrompt }] : []),
    { role: "user", content: request.prompt },
  ];

  try {
    const client = new Groq({ apiKey });
    const completion = await client.chat.completions.create({
      model,
      messages,
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      ...(request.maxTokens !== undefined ? { max_completion_tokens: request.maxTokens } : {}),
    });
    const text = completion.choices[0]?.message.content?.trim();

    if (!text) {
      return {
        success: false,
        provider: "groq",
        model,
        text: "",
        error: "Groq returned an empty response.",
      };
    }

    return { success: true, provider: "groq", model, text };
  } catch (error: unknown) {
    return {
      success: false,
      provider: "groq",
      model,
      text: "",
      error: error instanceof Error ? error.message : "Groq request failed.",
    };
  }
}

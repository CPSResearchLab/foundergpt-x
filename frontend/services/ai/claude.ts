import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
} from "@aws-sdk/client-bedrock-runtime";
import { MODELS } from "./models";
import type { AIRequest, AIResponse } from "./types";

export async function askClaude(request: AIRequest): Promise<AIResponse> {
  const model = request.model ?? MODELS.claude.default;
  const region = process.env.AWS_BEDROCK_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    return {
      success: false,
      provider: "claude",
      model,
      text: "",
      latencyMs: 0,
      error: "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required for Claude via Bedrock.",
    };
  }

  const client = new BedrockRuntimeClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  const messages: Message[] = [{ role: "user", content: [{ text: request.prompt }] }];

  const start = Date.now();
  try {
    const command = new ConverseCommand({
      modelId: model,
      messages,
      ...(request.systemPrompt
        ? { system: [{ text: request.systemPrompt }] }
        : {}),
      inferenceConfig: {
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
        ...(request.maxTokens !== undefined ? { maxTokens: request.maxTokens } : {}),
      },
    });

    const response = await client.send(command);
    const latencyMs = Date.now() - start;

    const text = response.output?.message?.content
      ?.map((b) => ("text" in b ? b.text : ""))
      .join("")
      .trim();

    if (!text) {
      return { success: false, provider: "claude", model, text: "", latencyMs, error: "Claude returned an empty response." };
    }

    const u = response.usage;
    const usage = u
      ? { promptTokens: u.inputTokens ?? 0, completionTokens: u.outputTokens ?? 0, totalTokens: u.totalTokens ?? 0 }
      : undefined;

    return { success: true, provider: "claude", model, text, latencyMs, usage };
  } catch (error: unknown) {
    return {
      success: false,
      provider: "claude",
      model,
      text: "",
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Claude request failed.",
    };
  }
}

import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
} from "@aws-sdk/client-bedrock-runtime";
import type { AIRequest, AIResponse } from "./types";

export async function generateBedrockResponse(
  modelId: string,
  systemPrompt: string | undefined,
  userPrompt: string,
  temperature?: number,
  maxTokens?: number,
): Promise<AIResponse> {
  const model = modelId;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    return {
      success: false,
      provider: "bedrock",
      model,
      text: "",
      latencyMs: 0,
      error: "AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY are required for Bedrock.",
    };
  }

  const client = new BedrockRuntimeClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  const messages: Message[] = [{ role: "user", content: [{ text: userPrompt }] }];

  const start = Date.now();
  try {
    const command = new ConverseCommand({
      modelId: model,
      messages,
      ...(systemPrompt
        ? { system: [{ text: systemPrompt }] }
        : {}),
      inferenceConfig: {
        ...(temperature !== undefined ? { temperature } : {}),
        ...(maxTokens !== undefined ? { maxTokens } : {}),
      },
    });

    const response = await client.send(command);
    const latencyMs = Date.now() - start;

    const text = response.output?.message?.content
      ?.map((b) => ("text" in b ? b.text : ""))
      .join("")
      .trim();

    if (!text) {
      return { success: false, provider: "bedrock", model, text: "", latencyMs, error: "Bedrock returned an empty response." };
    }

    const u = response.usage;
    const usage = u
      ? { promptTokens: u.inputTokens ?? 0, completionTokens: u.outputTokens ?? 0, totalTokens: u.totalTokens ?? 0 }
      : undefined;

    return { success: true, provider: "bedrock", model, text, latencyMs, usage };
  } catch (error: unknown) {
    return {
      success: false,
      provider: "bedrock",
      model,
      text: "",
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Bedrock request failed.",
    };
  }
}

/** Router-compatible adapter for the shared AI provider interface. */
export async function askBedrock(request: AIRequest): Promise<AIResponse> {
  if (!request.model) {
    return {
      success: false,
      provider: "bedrock",
      model: "",
      text: "",
      latencyMs: 0,
      error: "A Bedrock model ID is required.",
    };
  }

  return generateBedrockResponse(
    request.model,
    request.systemPrompt,
    request.prompt,
    request.temperature,
    request.maxTokens,
  );
}

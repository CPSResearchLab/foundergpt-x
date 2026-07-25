import type { AIProvider, AIPreset } from "./types";

export type ModelSpeed = "fast" | "balanced" | "slow";
export type ModelCost = "low" | "medium" | "high";

export interface AIModel {
  id: string;
  provider: AIProvider;
  displayName: string;
  purpose: string;
  speed: ModelSpeed;
  cost: ModelCost;
  contextWindow: number;
  supportsVision: boolean;
  supportsStreaming: boolean;
  supportsToolCalling: boolean;
  supportsReasoning: boolean;
  isDefault?: boolean;
}

/**
 * Canonical model catalog. Model IDs belong here, not in routing logic or UI
 * components. Add a model here before making it available to the application.
 */
export const MODEL_REGISTRY = {
  "amazon.nova-lite-v1:0": {
    id: "amazon.nova-lite-v1:0",
    provider: "bedrock",
    displayName: "Amazon Nova Lite",
    purpose: "Fast everyday chat, classification, and summarization",
    speed: "fast",
    cost: "low",
    contextWindow: 300000,
    supportsVision: true,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsReasoning: false,
    isDefault: true,
  },
  "amazon.nova-pro-v1:0": {
    id: "amazon.nova-pro-v1:0",
    provider: "bedrock",
    displayName: "Amazon Nova Pro",
    purpose: "High-quality multimodal analysis and planning",
    speed: "balanced",
    cost: "medium",
    contextWindow: 300000,
    supportsVision: true,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsReasoning: true,
  },
  "anthropic.claude-3-5-haiku-20241022-v1:0": {
    id: "anthropic.claude-3-5-haiku-20241022-v1:0",
    provider: "claude",
    displayName: "Claude 3.5 Haiku",
    purpose: "Fast structured responses and lightweight coding",
    speed: "fast",
    cost: "low",
    contextWindow: 200000,
    supportsVision: true,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsReasoning: false,
    isDefault: true,
  },
  "anthropic.claude-3-5-sonnet-20241022-v2:0": {
    id: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    provider: "claude",
    displayName: "Claude 3.5 Sonnet",
    purpose: "Deep reasoning, coding, and business analysis",
    speed: "balanced",
    cost: "high",
    contextWindow: 200000,
    supportsVision: true,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsReasoning: true,
  },
  "gemini-2.5-flash": {
    id: "gemini-2.5-flash",
    provider: "gemini",
    displayName: "Gemini 2.5 Flash",
    purpose: "Fast general-purpose multimodal assistance",
    speed: "fast",
    cost: "low",
    contextWindow: 1048576,
    supportsVision: true,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsReasoning: true,
    isDefault: true,
  },
  "gemini-2.5-pro": {
    id: "gemini-2.5-pro",
    provider: "gemini",
    displayName: "Gemini 2.5 Pro",
    purpose: "Complex reasoning and long-context analysis",
    speed: "balanced",
    cost: "high",
    contextWindow: 1048576,
    supportsVision: true,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsReasoning: true,
  },
  "llama-3.3-70b-versatile": {
    id: "llama-3.3-70b-versatile",
    provider: "groq",
    displayName: "Llama 3.3 70B Versatile",
    purpose: "Low-latency general chat and text generation",
    speed: "fast",
    cost: "low",
    contextWindow: 131072,
    supportsVision: false,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsReasoning: false,
    isDefault: true,
  },
  "openai/gpt-4.1-mini": {
    id: "openai/gpt-4.1-mini",
    provider: "openrouter",
    displayName: "GPT-4.1 Mini",
    purpose: "Balanced business writing and structured reasoning",
    speed: "fast",
    cost: "medium",
    contextWindow: 1047576,
    supportsVision: true,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsReasoning: true,
    isDefault: true,
  },
  "meta/llama-3.1-70b-instruct": {
    id: "meta/llama-3.1-70b-instruct",
    provider: "nvidia",
    displayName: "Llama 3.1 70B Instruct",
    purpose: "Open-weight instruction following and analysis",
    speed: "balanced",
    cost: "low",
    contextWindow: 131072,
    supportsVision: false,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsReasoning: false,
    isDefault: true,
  },
} as const satisfies Record<string, AIModel>;

export type ModelId = keyof typeof MODEL_REGISTRY;

/** Named workloads map to catalog IDs so callers do not need model knowledge. */
export const MODEL_PRESETS: Record<AIPreset, ModelId> = {
  fastChat: "amazon.nova-lite-v1:0",
  deepResearch: "amazon.nova-pro-v1:0",
  coding: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  businessPlanning: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  pitchDeck: "amazon.nova-pro-v1:0",
  financialAnalysis: "amazon.nova-pro-v1:0",
  marketing: "amazon.nova-pro-v1:0",
};

const models: AIModel[] = Object.values(MODEL_REGISTRY);

export function getModel(modelId: string | undefined): AIModel | undefined {
  return modelId ? MODEL_REGISTRY[modelId as ModelId] : undefined;
}

export function getPresetModel(preset: AIPreset | undefined): AIModel | undefined {
  return preset ? MODEL_REGISTRY[MODEL_PRESETS[preset]] : undefined;
}

export function getDefaultModelForProvider(provider: AIProvider): AIModel | undefined {
  return models.find((model) => model.provider === provider && model.isDefault);
}

/**
 * Backward-compatible provider defaults for provider implementations. New
 * routing code should use the registry helpers above.
 */
export const MODELS = {
  gemini: {
    fast: MODEL_REGISTRY["gemini-2.5-flash"].id,
    smart: MODEL_REGISTRY["gemini-2.5-pro"].id,
  },
  groq: {
    fast: MODEL_REGISTRY["llama-3.3-70b-versatile"].id,
  },
  openrouter: {
    default: MODEL_REGISTRY["openai/gpt-4.1-mini"].id,
  },
  nvidia: {
    default: MODEL_REGISTRY["meta/llama-3.1-70b-instruct"].id,
  },
  bedrock: {
    default: MODEL_REGISTRY["amazon.nova-lite-v1:0"].id,
    smart: MODEL_REGISTRY["amazon.nova-pro-v1:0"].id,
  },
  claude: {
    default: MODEL_REGISTRY["anthropic.claude-3-5-haiku-20241022-v1:0"].id,
    smart: MODEL_REGISTRY["anthropic.claude-3-5-sonnet-20241022-v2:0"].id,
  },
} as const;

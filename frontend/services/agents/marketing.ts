import { BaseAgent } from "./base";
import { MARKETING_AGENT_PROMPT } from "./prompts";
import type { AgentCapability } from "./types";

export class MarketingAgent extends BaseAgent {
  readonly name = "marketing";
  readonly displayLabel = "Marketing";
  readonly description = "Positioning, messaging, go-to-market strategy, and acquisition channels.";
  readonly icon = "📣";
  readonly capabilities: readonly AgentCapability[] = [
    { id: "positioning", name: "Positioning", description: "Define differentiated market positioning." },
    { id: "messaging", name: "Messaging", description: "Craft clear, compelling customer messaging." },
    { id: "gtm-strategy", name: "GTM Strategy", description: "Build a focused go-to-market plan." },
    { id: "content-strategy", name: "Content Strategy", description: "Plan content that attracts and converts." },
    { id: "channel-strategy", name: "Channel Strategy", description: "Identify and prioritise acquisition channels." },
    { id: "brand-voice", name: "Brand Voice", description: "Define and apply consistent brand voice." },
  ];
  protected readonly promptDefinition = MARKETING_AGENT_PROMPT;
}

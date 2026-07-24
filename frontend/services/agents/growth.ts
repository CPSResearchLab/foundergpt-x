import { BaseAgent } from "./base";
import { GROWTH_AGENT_PROMPT } from "./prompts";
import type { AgentCapability } from "./types";

export class GrowthAgent extends BaseAgent {
  readonly name = "growth";
  readonly displayLabel = "Growth";
  readonly description = "Growth experiments, acquisition funnels, retention loops, and scaling.";
  readonly icon = "🚀";
  readonly capabilities: readonly AgentCapability[] = [
    { id: "north-star", name: "North Star Metric", description: "Define the single metric that matters most." },
    { id: "funnel-analysis", name: "Funnel Analysis", description: "Identify and fix conversion drop-offs." },
    { id: "experiments", name: "Growth Experiments", description: "Design and prioritise growth experiments." },
    { id: "referral-loops", name: "Referral & Viral Loops", description: "Build viral and referral mechanics." },
    { id: "retention", name: "Retention", description: "Improve activation, engagement, and retention." },
    { id: "channel-scaling", name: "Channel Scaling", description: "Scale what works and kill what doesn't." },
  ];
  protected readonly promptDefinition = GROWTH_AGENT_PROMPT;
}

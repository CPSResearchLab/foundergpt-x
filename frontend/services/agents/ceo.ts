import { BaseAgent } from "./base";
import { CEO_AGENT_PROMPT } from "./prompts";
import type { AgentCapability } from "./types";

export class CeoAgent extends BaseAgent {
  readonly name = "ceo";
  readonly displayLabel = "CEO";
  readonly description = "Company strategy, vision, priorities, and high-leverage decisions.";
  readonly icon = "🏛️";
  readonly capabilities: readonly AgentCapability[] = [
    { id: "strategy", name: "Strategy", description: "Define and refine company strategy and direction." },
    { id: "prioritisation", name: "Prioritisation", description: "Identify the single most important next move." },
    { id: "vision", name: "Vision & Mission", description: "Articulate and sharpen company vision and mission." },
    { id: "okrs", name: "OKRs", description: "Set and align objectives and key results." },
    { id: "decision-making", name: "Decision Making", description: "Structure and resolve high-stakes decisions." },
    { id: "team-alignment", name: "Team Alignment", description: "Align team around strategy and execution." },
  ];
  protected readonly promptDefinition = CEO_AGENT_PROMPT;
}

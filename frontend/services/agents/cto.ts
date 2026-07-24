import { BaseAgent } from "./base";
import { CTO_AGENT_PROMPT } from "./prompts";
import type { AgentCapability } from "./types";

export class CtoAgent extends BaseAgent {
  readonly name = "cto";
  readonly displayLabel = "CTO";
  readonly description = "Technology architecture, stack decisions, and engineering strategy.";
  readonly icon = "⚙️";
  readonly capabilities: readonly AgentCapability[] = [
    { id: "architecture", name: "Architecture", description: "Design and evaluate system architecture." },
    { id: "stack-selection", name: "Stack Selection", description: "Choose the right technologies for the job." },
    { id: "build-vs-buy", name: "Build vs Buy", description: "Evaluate build, buy, or integrate trade-offs." },
    { id: "technical-debt", name: "Technical Debt", description: "Identify and prioritise technical debt." },
    { id: "engineering-hiring", name: "Engineering Hiring", description: "Advise on engineering team structure and hiring." },
    { id: "security", name: "Security", description: "Surface security and compliance considerations." },
    { id: "scalability", name: "Scalability", description: "Plan for scale before it becomes a crisis." },
  ];
  protected readonly promptDefinition = CTO_AGENT_PROMPT;
}

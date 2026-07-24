import { BaseAgent } from "./base";
import { SALES_AGENT_PROMPT } from "./prompts";
import type { AgentCapability } from "./types";

export class SalesAgent extends BaseAgent {
  readonly name = "sales";
  readonly displayLabel = "Sales";
  readonly description = "Sales process, ICP, outreach scripts, objection handling, and pipeline.";
  readonly icon = "🤝";
  readonly capabilities: readonly AgentCapability[] = [
    { id: "icp", name: "Ideal Customer Profile", description: "Define and refine the ICP." },
    { id: "outreach", name: "Outreach Scripts", description: "Write cold email and LinkedIn outreach." },
    { id: "discovery", name: "Discovery Questions", description: "Build a discovery call framework." },
    { id: "objection-handling", name: "Objection Handling", description: "Prepare responses to common objections." },
    { id: "closing", name: "Closing Techniques", description: "Structure the close and follow-up." },
    { id: "pipeline", name: "Pipeline Management", description: "Design and optimise the sales pipeline." },
  ];
  protected readonly promptDefinition = SALES_AGENT_PROMPT;
}

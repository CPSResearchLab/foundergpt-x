import { BaseAgent } from "./base";
import { FINANCE_AGENT_PROMPT } from "./prompts";
import type { AgentCapability } from "./types";

export class FinanceAgent extends BaseAgent {
  readonly name = "finance";
  readonly displayLabel = "Finance";
  readonly description = "Financial modelling, unit economics, burn rate, and investor financials.";
  readonly icon = "📈";
  readonly capabilities: readonly AgentCapability[] = [
    { id: "financial-model", name: "Financial Model", description: "Build and stress-test revenue and cost models." },
    { id: "unit-economics", name: "Unit Economics", description: "Calculate CAC, LTV, payback period, and margins." },
    { id: "runway", name: "Runway & Burn", description: "Model burn rate and cash runway scenarios." },
    { id: "pricing", name: "Pricing Strategy", description: "Optimise pricing for growth and margin." },
    { id: "fundraising-financials", name: "Fundraising Financials", description: "Prepare investor-ready financial projections." },
    { id: "scenarios", name: "Scenario Planning", description: "Model base, optimistic, and pessimistic scenarios." },
  ];
  protected readonly promptDefinition = FINANCE_AGENT_PROMPT;
}

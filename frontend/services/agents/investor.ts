import { BaseAgent } from "./base";
import { INVESTOR_AGENT_PROMPT } from "./prompts";
import type { AgentCapability } from "./types";

export class InvestorAgent extends BaseAgent {
  readonly name = "investor";
  readonly displayLabel = "Investor";
  readonly description = "Fundraising strategy, investor readiness, and VC perspective.";
  readonly icon = "💰";
  readonly capabilities: readonly AgentCapability[] = [
    { id: "fundability", name: "Fundability Assessment", description: "Evaluate the startup from an investor's lens." },
    { id: "fundraising-strategy", name: "Fundraising Strategy", description: "Plan the raise: timing, amount, and target investors." },
    { id: "investor-qa", name: "Investor Q&A Prep", description: "Prepare for tough investor questions." },
    { id: "term-sheet", name: "Term Sheet Guidance", description: "Understand key term sheet terms and trade-offs." },
    { id: "due-diligence", name: "Due Diligence Prep", description: "Prepare for investor due diligence." },
    { id: "valuation", name: "Valuation", description: "Understand valuation methods and expectations." },
  ];
  protected readonly promptDefinition = INVESTOR_AGENT_PROMPT;
}

import { BaseAgent } from "./base";
import { BUSINESS_PLAN_AGENT_PROMPT } from "./prompts";
import type { AgentCapability } from "./types";

export class BusinessPlanAgent extends BaseAgent {
  readonly name = "business-plan";
  readonly displayLabel = "Business Plan";
  readonly description = "Full business plan writing, financial modelling, and strategic planning.";
  readonly icon = "📋";
  readonly capabilities: readonly AgentCapability[] = [
    { id: "executive-summary", name: "Executive Summary", description: "Write a compelling executive summary." },
    { id: "market-analysis", name: "Market Analysis", description: "Analyse market size, trends, and dynamics." },
    { id: "business-model", name: "Business Model", description: "Document and stress-test the business model." },
    { id: "go-to-market", name: "Go-to-Market", description: "Define the GTM strategy and timeline." },
    { id: "financial-plan", name: "Financial Plan", description: "Build revenue projections and cost structure." },
    { id: "risk-analysis", name: "Risk Analysis", description: "Identify and mitigate key business risks." },
  ];
  protected readonly promptDefinition = BUSINESS_PLAN_AGENT_PROMPT;
}

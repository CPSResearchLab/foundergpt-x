import { BaseAgent } from "./base";
import { RESEARCH_AGENT_PROMPT } from "./prompts";
import type { AgentCapability } from "./types";

export class ResearchAgent extends BaseAgent {
  readonly name = "research";
  readonly displayLabel = "Research";
  readonly description = "Market research, competitive analysis, and industry intelligence.";
  readonly icon = "🔬";
  readonly capabilities: readonly AgentCapability[] = [
    { id: "market-research", name: "Market Research", description: "Assess market size, segments, and opportunities." },
    { id: "competitor-analysis", name: "Competitor Analysis", description: "Compare alternatives, positioning, and differentiation." },
    { id: "swot", name: "SWOT Analysis", description: "Identify strengths, weaknesses, opportunities, and threats." },
    { id: "customer-persona", name: "Customer Persona", description: "Develop evidence-based customer personas." },
    { id: "industry-analysis", name: "Industry Analysis", description: "Evaluate industry structure and dynamics." },
    { id: "trend-analysis", name: "Trend Analysis", description: "Assess relevant market and technology trends." },
    { id: "funding-landscape", name: "Funding Landscape", description: "Map funding patterns and investor considerations." },
    { id: "technology-review", name: "Technology Review", description: "Evaluate technology options and implications." },
  ];
  protected readonly promptDefinition = RESEARCH_AGENT_PROMPT;
}

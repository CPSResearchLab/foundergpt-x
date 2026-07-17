import { BaseAgent } from "./base";
import { RESEARCH_AGENT_PROMPT } from "./prompts";
import type { AgentCapability } from "./types";

export const RESEARCH_AGENT_CAPABILITIES: readonly AgentCapability[] = [
  ["market-research", "Market Research", "Assess market size, segments, and opportunities."],
  ["competitor-analysis", "Competitor Analysis", "Compare alternatives, positioning, and differentiation."],
  ["swot", "SWOT", "Identify strengths, weaknesses, opportunities, and threats."],
  ["customer-persona", "Customer Persona", "Develop evidence-based customer personas."],
  ["industry-analysis", "Industry Analysis", "Evaluate industry structure and dynamics."],
  ["trend-analysis", "Trend Analysis", "Assess relevant market and technology trends."],
  ["funding-landscape", "Funding Landscape", "Map funding patterns and investor considerations."],
  ["technology-review", "Technology Review", "Evaluate technology options and implications."],
].map(([id, name, description]) => ({ id, name, description }));

export class ResearchAgent extends BaseAgent {
  readonly name = "research";
  readonly description = "Delivers structured startup research grounded in FounderGPT X memory context.";
  readonly capabilities = RESEARCH_AGENT_CAPABILITIES;
  protected readonly promptDefinition = RESEARCH_AGENT_PROMPT;
}

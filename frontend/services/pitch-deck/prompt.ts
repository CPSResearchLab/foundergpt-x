import type { SlideType } from "./types";

export interface PitchDeckPromptInput {
  projectName: string;
  industry: string;
  description: string;
  targetInvestor: string;
  founderNames: string[];
  companyNames: string[];
  businessModels: string[];
  competitors: string[];
  technologies: string[];
  targetCustomers: string[];
  goals: string[];
  fundingMentions: string[];
  problems: string[];
  decisions: string[];
  recentChatSummary: string;
  documentSummary: string;
  additionalContext: string;
}

export const SLIDE_INSTRUCTIONS: Record<SlideType, string> = {
  "title": "Company name, tagline, founder name(s), contact. One-liner that makes an investor lean forward.",
  "vision": "The world you are building toward in 5–10 years. Audacious but believable. Why now.",
  "problem": "The specific, painful, large problem. Quantify the pain. Show you deeply understand the customer.",
  "solution": "Your product/service. How it solves the problem uniquely. Key differentiators. Demo-worthy moment.",
  "market": "TAM/SAM/SOM with methodology. Bottom-up preferred. Growth rate. Why this market, why now.",
  "business-model": "How you make money. Unit economics. Pricing. Revenue streams. Path to profitability.",
  "competition": "Competitive landscape. 2x2 matrix axes. Why you win. Moats and defensibility.",
  "technology": "Core tech innovation. IP. Build vs buy. Scalability. Technical moat.",
  "traction": "Evidence of product-market fit. Revenue, users, growth rate, retention, key partnerships, press.",
  "go-to-market": "How you acquire customers. Channels. CAC. Sales motion. First 100 customers strategy.",
  "financials": "3-year projections. Key assumptions. Burn rate. Runway. Path to break-even.",
  "roadmap": "12-month milestones. What you will build with the funding. Key hires. Product releases.",
  "team": "Founder backgrounds. Why this team. Relevant experience. Advisors. Key hires needed.",
  "funding-ask": "Amount raising. Use of funds breakdown. Milestones this round achieves. Valuation context.",
  "appendix": "Supporting data. Detailed financials. Customer testimonials. Technical architecture. Legal structure.",
};

export function buildPitchDeckSystemPrompt(): string {
  return `You are a world-class pitch deck strategist who has helped companies raise over $500M from top-tier VCs.

Your job is to generate an investor-grade pitch deck in structured JSON format.

Rules:
- Every slide must be specific to the company — no generic startup clichés
- Use the founder context provided to personalise every slide
- Headlines must be punchy, specific, and memorable (max 12 words)
- Body bullets must be concrete — numbers, names, specifics over vague claims
- Speaker notes must sound natural when spoken aloud
- Visual/chart/icon/image suggestions must be actionable for a designer
- Flag every claim that needs supporting data in proofGaps
- Never fabricate metrics, names, or data not present in the context
- If data is missing, write what SHOULD go there with [DATA NEEDED] marker

Output ONLY valid JSON matching this exact schema — no markdown, no explanation:

{
  "oneLiner": "string — one sentence elevator pitch",
  "slides": {
    "<slideType>": {
      "headline": "string",
      "body": ["string", "string", ...],
      "speakerNotes": "string",
      "visualSuggestion": "string",
      "chartSuggestion": "string",
      "iconSuggestions": ["string", "string", "string"],
      "imageSuggestion": "string",
      "proofGaps": ["string", ...]
    }
  }
}

Slide types to generate: title, vision, problem, solution, market, business-model, competition, technology, traction, go-to-market, financials, roadmap, team, funding-ask, appendix`;
}

export function buildPitchDeckUserPrompt(input: PitchDeckPromptInput): string {
  const lines: string[] = [
    `Generate a complete investor pitch deck for the following startup:`,
    ``,
    `## Company`,
    `Name: ${input.projectName || "[Company Name]"}`,
    `Industry: ${input.industry || "[Industry]"}`,
    `Description: ${input.description || "[Description]"}`,
    `Target investor: ${input.targetInvestor}`,
  ];

  if (input.founderNames.length > 0)
    lines.push(`Founders: ${input.founderNames.join(", ")}`);
  if (input.companyNames.length > 0)
    lines.push(`Company names mentioned: ${input.companyNames.join(", ")}`);
  if (input.businessModels.length > 0)
    lines.push(`Business model: ${input.businessModels.join(", ")}`);
  if (input.targetCustomers.length > 0)
    lines.push(`Target customers: ${input.targetCustomers.join(", ")}`);
  if (input.competitors.length > 0)
    lines.push(`Competitors: ${input.competitors.join(", ")}`);
  if (input.technologies.length > 0)
    lines.push(`Technologies: ${input.technologies.join(", ")}`);
  if (input.goals.length > 0)
    lines.push(`Goals: ${input.goals.slice(0, 5).join(" | ")}`);
  if (input.fundingMentions.length > 0)
    lines.push(`Funding context: ${input.fundingMentions.slice(0, 3).join(", ")}`);
  if (input.problems.length > 0)
    lines.push(`Problems being solved: ${input.problems.slice(0, 3).join(" | ")}`);
  if (input.decisions.length > 0)
    lines.push(`Key decisions made: ${input.decisions.slice(0, 3).join(" | ")}`);

  if (input.recentChatSummary) {
    lines.push(``, `## Recent Conversations`, input.recentChatSummary);
  }
  if (input.documentSummary) {
    lines.push(``, `## Uploaded Documents`, input.documentSummary);
  }
  if (input.additionalContext) {
    lines.push(``, `## Additional Context`, input.additionalContext);
  }

  lines.push(``, `## Slide Instructions`);
  for (const [type, instruction] of Object.entries(SLIDE_INSTRUCTIONS)) {
    lines.push(`${type}: ${instruction}`);
  }

  lines.push(``, `Generate the complete pitch deck JSON now.`);
  return lines.join("\n");
}

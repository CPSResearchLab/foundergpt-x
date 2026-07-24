// ─── Slide types ──────────────────────────────────────────────────────────────

export type SlideType =
  | "title"
  | "vision"
  | "problem"
  | "solution"
  | "market"
  | "business-model"
  | "competition"
  | "technology"
  | "traction"
  | "go-to-market"
  | "financials"
  | "roadmap"
  | "team"
  | "funding-ask"
  | "appendix";

export const SLIDE_ORDER: SlideType[] = [
  "title",
  "vision",
  "problem",
  "solution",
  "market",
  "business-model",
  "competition",
  "technology",
  "traction",
  "go-to-market",
  "financials",
  "roadmap",
  "team",
  "funding-ask",
  "appendix",
];

export const SLIDE_LABELS: Record<SlideType, string> = {
  "title": "Title",
  "vision": "Vision",
  "problem": "Problem",
  "solution": "Solution",
  "market": "Market",
  "business-model": "Business Model",
  "competition": "Competition",
  "technology": "Technology",
  "traction": "Traction",
  "go-to-market": "Go-To-Market",
  "financials": "Financials",
  "roadmap": "Roadmap",
  "team": "Team",
  "funding-ask": "Funding Ask",
  "appendix": "Appendix",
};

// ─── Slide content ────────────────────────────────────────────────────────────

export interface SlideContent {
  /** Short punchy headline — max 12 words. */
  headline: string;
  /** Main body content — 3–6 bullet points or short paragraphs. */
  body: string[];
  /** What the presenter says — 3–5 sentences of speaker notes. */
  speakerNotes: string;
  /** Concrete visual layout suggestion (e.g. "Split layout: icon left, text right"). */
  visualSuggestion: string;
  /** Specific chart type and data to show (e.g. "Bar chart: TAM $12B, SAM $2B, SOM $200M"). */
  chartSuggestion: string;
  /** 2–3 icon names from Lucide or similar (e.g. ["TrendingUp", "Users", "DollarSign"]). */
  iconSuggestions: string[];
  /** Concrete image/photo description for a designer (e.g. "Hero shot of product dashboard"). */
  imageSuggestion: string;
  /** Proof gaps — claims that need supporting data. Empty array if none. */
  proofGaps: string[];
}

// ─── Pitch deck ───────────────────────────────────────────────────────────────

export interface PitchDeck {
  id: string;
  projectId: string;
  ownerId: string;
  title: string;
  /** One-sentence elevator pitch. */
  oneLiner: string;
  /** Target investor type (e.g. "Pre-seed VC", "Angel", "Series A"). */
  targetInvestor: string;
  slides: Record<SlideType, SlideContent>;
  generatedAt: string;
  updatedAt: string;
  /** Generation context snapshot — what memory was used. */
  contextSnapshot: {
    projectName: string;
    industry: string;
    stage: string;
    founderNames: string[];
    companyNames: string[];
    businessModels: string[];
    competitors: string[];
    goals: string[];
    fundingMentions: string[];
  };
}

// ─── Export formats ───────────────────────────────────────────────────────────

export type ExportFormat = "markdown" | "html" | "pptx" | "pdf";

// ─── API shapes ───────────────────────────────────────────────────────────────

export interface GenerateDeckInput {
  projectId: string;
  ownerId: string;
  projectName: string;
  projectIndustry: string;
  projectDescription: string;
  targetInvestor?: string;
  additionalContext?: string;
}

export interface DeckListItem {
  id: string;
  projectId: string;
  title: string;
  oneLiner: string;
  targetInvestor: string;
  generatedAt: string;
  updatedAt: string;
  slideCount: number;
}

export interface UpdateSlideInput {
  slideType: SlideType;
  content: Partial<SlideContent>;
}

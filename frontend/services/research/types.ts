export type KnowledgeObjectType =
  | "Company"
  | "Startup"
  | "Investor"
  | "Market"
  | "Product"
  | "Competitor"
  | "Technology"
  | "ResearchPaper"
  | "Person"
  | "Patent"
  | "Framework"
  | "BusinessModel"
  | "PricingModel"
  | "FundingRound"
  | "GovernmentPolicy"
  | "Law"
  | "Risk"
  | "Opportunity"
  | "Trend"
  | "Prediction";

export interface KnowledgeRelationship {
  targetId: string;
  type: string; // e.g., "COMPETES_WITH", "FOUNDED_BY", "INVESTED_IN"
  description?: string;
  confidence: number;
}

export interface KnowledgeObject {
  id: string;
  type: KnowledgeObjectType;
  name: string;
  description: string;
  attributes: Record<string, unknown>;
  relationships: KnowledgeRelationship[];
  sources: string[]; // Source IDs
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export type ResearchType =
  | "MarketResearch"
  | "CompetitorResearch"
  | "IndustryResearch"
  | "TechnologyResearch"
  | "StartupResearch"
  | "InvestorResearch"
  | "AcademicResearch"
  | "PatentResearch"
  | "FinancialResearch"
  | "ProductResearch"
  | "HiringResearch"
  | "RegulatoryResearch";

export interface Source {
  id: string;
  title: string;
  url?: string;
  author?: string;
  publishedDate?: string;
  confidence: number;
  category: "web" | "document" | "memory" | "project_file" | "api" | "other";
  content?: string;
}

export type CitationFormatType = "APA" | "MLA" | "IEEE" | "Markdown" | "PlainText";

export interface FactClaim {
  id: string;
  statement: string;
  sourceIds: string[];
  confidence: number;
  conflictsWith?: string[]; // IDs of conflicting claims
  verificationStatus: "Verified" | "Unverified" | "Conflicted" | "Unsupported";
}

export interface ResearchReportSection {
  title: string;
  content: string;
  type:
    | "ExecutiveSummary"
    | "KeyFindings"
    | "Evidence"
    | "SourceQuality"
    | "Confidence"
    | "Charts"
    | "Recommendations"
    | "Appendix"
    | "ActionItems"
    | "NextSteps"
    | "MarketOverview"
    | "CompetitorAnalysis"
    | "SWOT"
    | "Risks"
    | "Opportunities"
    | "Sources"
    | "Custom";
}

export interface ResearchReport {
  id: string;
  title: string;
  executiveSummary: string;
  sections: ResearchReportSection[];
  knowledgeObjectsGenerated: string[]; // IDs of Knowledge Objects
  overallConfidence: number;
  citations: string[];
}

export interface ResearchSession {
  id: string;
  projectId: string;
  title: string;
  objective: string;
  status: "Planned" | "InProgress" | "FactVerification" | "Summarization" | "Completed" | "Failed";
  type: ResearchType;
  createdAt: string;
  completedAt?: string;
  confidence?: number;
  sources: Source[];
  citations: string[];
  report?: ResearchReport;
  knowledgeObjects: KnowledgeObject[];
}

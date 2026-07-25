import type { FactClaim, ResearchReport, ResearchReportSection, Source } from "./types";
import { CitationEngine } from "./citation-engine";

export class ReportGenerator {
  private citationEngine = new CitationEngine();

  async generateReport(title: string, claims: FactClaim[], sources: Source[], generatedObjectIds: string[]): Promise<ResearchReport> {
    const sections: ResearchReportSection[] = [];

    // Basic structure for a professional report
    sections.push({
      title: "Key Findings",
      type: "KeyFindings",
      content: claims.map(c => `- ${c.statement}`).join("\n")
    });

    sections.push({
      title: "Evidence & Confidence",
      type: "Confidence",
      content: `The findings are supported by ${sources.length} sources with an average confidence score of ${this.calculateConfidence(claims)}.`
    });

    const report: ResearchReport = {
      id: `report_${Date.now()}`,
      title,
      executiveSummary: "Executive summary of the research findings based on aggregated knowledge.",
      sections,
      knowledgeObjectsGenerated: generatedObjectIds,
      overallConfidence: this.calculateConfidence(claims),
      citations: sources.map(s => this.citationEngine.formatCitation(s, "APA"))
    };

    return report;
  }

  private calculateConfidence(claims: FactClaim[]): number {
    if (claims.length === 0) return 0;
    return claims.reduce((acc, c) => acc + c.confidence, 0) / claims.length;
  }
}

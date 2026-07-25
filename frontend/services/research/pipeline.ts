import type { ResearchSession, ResearchType, Source, KnowledgeObject } from "./types";
import { SourceManager } from "./source-manager";
import { FactVerifier } from "./fact-verifier";
import { KnowledgeExtractor } from "./knowledge-extractor";
import { KnowledgeObjectManager } from "./knowledge-objects";
import { ResearchMemoryIntegration } from "./research-memory";
import { ReportGenerator } from "./report-generator";

export class ResearchPipeline {
  private sourceManager = new SourceManager();
  private factVerifier = new FactVerifier();
  private objectManager = new KnowledgeObjectManager();
  private extractor = new KnowledgeExtractor(this.objectManager);
  private memoryIntegration = new ResearchMemoryIntegration();
  private reportGenerator = new ReportGenerator();

  private sessions: Map<string, ResearchSession> = new Map();

  async executeResearch(projectId: string, title: string, objective: string, type: ResearchType, rawSources: Omit<Source, "id">[]): Promise<ResearchSession> {
    const id = `session_${Date.now()}`;
    const session: ResearchSession = {
      id,
      projectId,
      title,
      objective,
      status: "Planned",
      type,
      createdAt: new Date().toISOString(),
      sources: [],
      citations: [],
      knowledgeObjects: []
    };

    this.sessions.set(id, session);
    
    try {
      // 1. Source Collection & Deduplication
      session.status = "InProgress";
      const processedSources: Source[] = [];
      for (const rawSource of rawSources) {
        processedSources.push(await this.sourceManager.addSource(rawSource));
      }
      session.sources = processedSources;

      // 2. Fact Verification
      session.status = "FactVerification";
      const textCorpus = processedSources.map(s => s.content || s.title).join("\n\n");
      await this.factVerifier.extractAndVerify(textCorpus, processedSources);
      await this.factVerifier.resolveConflicts();
      const verifiedClaims = this.factVerifier.getVerifiedClaims();

      // 3. Knowledge Extraction & Object Creation
      const objectIds = await this.extractor.extractFromClaims(verifiedClaims, processedSources);
      const objects = await Promise.all(objectIds.map(oid => this.objectManager.getObject(oid)));
      const validObjects = objects.filter(o => o !== undefined) as KnowledgeObject[]; // Type assertion for brevity here
      session.knowledgeObjects = validObjects;

      // 4. Memory and Graph Integration
      for (const obj of validObjects) {
        await this.memoryIntegration.saveKnowledgeToMemory(projectId, obj);
        try {
          const { researchGraphIntegration } = await import("../graph/research-integration");
          await researchGraphIntegration.onKnowledgeObjectCreated(obj);
        } catch (e) {
          console.error("Failed to integrate knowledge object with graph", e);
        }
      }

      // 5. Summarization & Report Generation
      session.status = "Summarization";
      const report = await this.reportGenerator.generateReport(title, verifiedClaims, processedSources, objectIds);
      session.report = report;
      session.citations = report.citations;
      session.confidence = report.overallConfidence;

      // Finish
      session.status = "Completed";
      session.completedAt = new Date().toISOString();
      return session;

    } catch (error) {
      session.status = "Failed";
      throw error;
    }
  }

  async getSession(id: string): Promise<ResearchSession | undefined> {
    return this.sessions.get(id);
  }
}

export const researchPipeline = new ResearchPipeline();

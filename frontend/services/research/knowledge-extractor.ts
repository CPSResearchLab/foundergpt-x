import type { KnowledgeObjectManager } from "./knowledge-objects";
import type { FactClaim, Source } from "./types";

export class KnowledgeExtractor {
  constructor(private objectManager: KnowledgeObjectManager) {}

  async extractFromClaims(claims: FactClaim[], sources: Source[]): Promise<string[]> {
    // In a real implementation, this would use AWS Bedrock to map facts to structured KnowledgeObjects
    // For this foundation, we create a generic "discovery" knowledge object
    
    if (claims.length === 0) return [];

    const obj = await this.objectManager.createObject(
      "Trend",
      "Research Discovery",
      claims.map(c => c.statement).join(" "),
      {},
      sources.map(s => s.id),
      claims.reduce((acc, c) => acc + c.confidence, 0) / claims.length
    );

    return [obj.id];
  }
}

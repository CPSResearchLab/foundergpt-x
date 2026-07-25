import { graphManager } from "./manager";
import type { KnowledgeObject } from "../research/types";
import type { NodeType, RelationshipType } from "./types";

export class ResearchGraphIntegration {
  /**
   * Called by the Research Pipeline when a new KnowledgeObject is created.
   * Maps it directly into the graph.
   */
  async onKnowledgeObjectCreated(obj: KnowledgeObject): Promise<void> {
    const nodeId = `ko_${obj.id}`;
    
    // Create node
    graphManager.createNode(nodeId, obj.type as NodeType, obj.name, {
      description: obj.description,
      attributes: obj.attributes,
      sources: obj.sources,
      confidence: obj.confidence
    });

    // Create edges for relationships
    for (const rel of obj.relationships) {
      const targetId = `ko_${rel.targetId}`;
      
      // Ensure target exists, if not, create a placeholder node to link to
      if (!graphManager.findNode(targetId)) {
        graphManager.createNode(targetId, "KnowledgeObject", `Unknown ${rel.targetId}`);
      }

      graphManager.createRelationship(nodeId, targetId, rel.type as RelationshipType, rel.confidence, { description: rel.description });
    }
  }
}

export const researchGraphIntegration = new ResearchGraphIntegration();

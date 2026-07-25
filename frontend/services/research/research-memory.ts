import { memoryManager } from "../memory/memory-manager";
import type { KnowledgeObject } from "./types";
import type { MemoryType } from "../memory/memory-v2";

export class ResearchMemoryIntegration {
  /**
   * Persists a KnowledgeObject into the long-term memory system.
   */
  async saveKnowledgeToMemory(projectId: string, obj: KnowledgeObject): Promise<void> {
    const title = `${obj.type}: ${obj.name}`;
    const summary = obj.description;
    
    // Serialize attributes and relationships into the content
    let content = `Type: ${obj.type}\nName: ${obj.name}\nDescription: ${obj.description}\n\n`;
    
    if (Object.keys(obj.attributes).length > 0) {
      content += `Attributes:\n${JSON.stringify(obj.attributes, null, 2)}\n\n`;
    }
    
    if (obj.relationships.length > 0) {
      content += `Relationships:\n${obj.relationships.map(r => `- ${r.type} -> ${r.targetId} (Confidence: ${r.confidence})`).join("\n")}\n\n`;
    }
    
    content += `Sources: ${obj.sources.join(", ")}`;

    await memoryManager.save({
      type: this.mapType(obj.type),
      projectId,
      title,
      summary,
      content,
      importance: obj.confidence, // Map confidence (0-1) to importance
      source: "research-system",
      tags: ["research", "knowledge-object", obj.type.toLowerCase(), obj.name.toLowerCase()],
      metadata: {
        knowledgeObjectId: obj.id,
        knowledgeObjectType: obj.type,
      }
    });
  }

  /**
   * Maps a KnowledgeObjectType to a valid MemoryType.
   */
  private mapType(type: string): MemoryType {
    const validTypes = ["COMPANY", "PROJECT", "DOCUMENT", "RESEARCH", "TASK", "GOAL", "DECISION", "MEETING", "PRODUCT", "INVESTOR", "COMPETITOR", "NOTE", "IDEA"];
    const upper = type.toUpperCase();
    if (validTypes.includes(upper)) {
      return upper as MemoryType;
    }
    return "RESEARCH"; // Fallback
  }

  /**
   * General discoveries that don't neatly fit into a single KnowledgeObject.
   */
  async saveDiscovery(projectId: string, title: string, content: string, tags: string[] = []): Promise<void> {
    await memoryManager.save({
      type: "RESEARCH",
      projectId,
      title,
      content,
      importance: 0.8,
      source: "research-system",
      tags: ["discovery", ...tags]
    });
  }
}

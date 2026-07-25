import { graphManager } from "./manager";
import type { NodeType } from "./types";
import type { Memory } from "../memory/memory-v2";

export class MemoryGraphIntegration {
  /**
   * Called whenever a memory is saved/updated in MemoryManager.
   * Creates or updates the corresponding graph node and edges.
   */
  async onMemorySaved(memory: Memory): Promise<void> {
    const nodeId = `memory_${memory.id}`;
    
    // Map MemoryType to Graph NodeType
    const nodeType = this.mapMemoryType(memory.type);
    
    // Create or update the main node
    graphManager.createNode(nodeId, nodeType, memory.title, {
      summary: memory.summary,
      importance: memory.importance,
      source: memory.source,
      tags: memory.tags
    });

    // Link to project
    if (memory.projectId) {
      const projectId = `project_${memory.projectId}`;
      if (!graphManager.findNode(projectId)) {
        graphManager.createNode(projectId, "Project", `Project ${memory.projectId}`);
      }
      graphManager.createRelationship(nodeId, projectId, "BELONGS_TO", 1.0);
    }

    // Infer edges from tags
    for (const tag of memory.tags) {
      const tagNodeId = `tag_${tag.toLowerCase()}`;
      if (!graphManager.findNode(tagNodeId)) {
        // We use Idea as a fallback for tags that don't match specific entities yet
        graphManager.createNode(tagNodeId, "Idea", tag);
      }
      graphManager.createRelationship(nodeId, tagNodeId, "RELATED_TO", memory.importance);
    }
  }

  private mapMemoryType(type: string): NodeType {
    const validTypes: NodeType[] = [
      "User", "Company", "Project", "Document", "Memory", "Research", 
      "Investor", "Competitor", "Product", "Goal", "Task", "Decision", 
      "Meeting", "Idea", "Market"
    ];
    
    const upper = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    
    if (validTypes.includes(upper as NodeType)) {
      return upper as NodeType;
    }
    
    return "Memory"; // Default fallback
  }
}

export const memoryGraphIntegration = new MemoryGraphIntegration();

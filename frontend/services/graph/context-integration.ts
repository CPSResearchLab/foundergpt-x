import { graphManager } from "./manager";
import { graphSerializer } from "./serializer";

export class GraphContextIntegration {
  /**
   * Retrieves a rich graph subgraph around a specific project to inject into AI context.
   */
  getProjectContext(projectId: string, maxDepth: number = 2): string {
    const node = graphManager.findNode(`project_${projectId}`);
    if (!node) return "";

    const subgraph = graphManager.findSubgraph(node.id, maxDepth);
    return graphSerializer.serializeToContextString(subgraph);
  }

  /**
   * Enriches a specific query by looking up related nodes by keyword/label.
   */
  enrichQueryContext(keywords: string[]): string {
    const allNodes = graphManager.findNodesByType("Idea").concat(
      graphManager.findNodesByType("Company"),
      graphManager.findNodesByType("KnowledgeObject")
    );
    
    const matchedNodes = allNodes.filter(n => keywords.some(k => n.label.toLowerCase().includes(k.toLowerCase())));
    if (matchedNodes.length === 0) return "";

    const subgraphNodes = new Set<string>();
    matchedNodes.forEach(n => subgraphNodes.add(n.id));

    // Get 1-hop neighbors for all matched nodes
    for (const node of matchedNodes) {
      const neighbors = graphManager.findNeighbors(node.id);
      neighbors.forEach(n => subgraphNodes.add(n.id));
    }

    const finalSubgraph = {
      nodes: Array.from(subgraphNodes).map(id => graphManager.findNode(id)!),
      edges: [] as import("./types").GraphEdge[]
    };

    return graphSerializer.serializeToContextString(finalSubgraph);
  }
}

export const graphContextIntegration = new GraphContextIntegration();

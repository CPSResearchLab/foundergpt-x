import type { GraphManager } from "./manager";
import type { GraphNode } from "./types";

export class GraphReasoner {
  constructor(private manager: GraphManager) {}

  findRelatedCompanies(companyId: string): GraphNode[] {
    const subgraph = this.manager.findSubgraph(companyId, 2);
    return subgraph.nodes.filter(n => n.type === "Company" || n.type === "Startup" || n.type === "Organization" && n.id !== companyId);
  }

  findSimilarInvestors(investorId: string): GraphNode[] {
    // Basic reasoning: find investors who co-invested in the same companies
    const investor = this.manager.findNode(investorId);
    if (!investor) return [];

    const subgraph = this.manager.findSubgraph(investorId, 2);
    const similar = subgraph.nodes.filter(n => n.type === "Investor" && n.id !== investorId);
    
    // Deduplicate array
    const unique = Array.from(new Map(similar.map(item => [item.id, item])).values());
    return unique;
  }

  findProjectTechnologies(projectId: string): GraphNode[] {
    const subgraph = this.manager.findSubgraph(projectId, 2);
    return subgraph.nodes.filter(n => n.type === "Technology");
  }

  findHiddenRelationships(nodeAId: string, nodeBId: string): GraphNode[] {
    // Finds nodes that bridge A and B (length 2 path)
    const neighborsA = new Set(this.manager.findNeighbors(nodeAId).map(n => n.id));
    const neighborsB = this.manager.findNeighbors(nodeBId);
    
    const sharedIds = neighborsB.filter(n => neighborsA.has(n.id)).map(n => n.id);
    return sharedIds.map(id => this.manager.findNode(id)).filter((n): n is GraphNode => n !== null);
  }

  findProjectDependencies(projectId: string): GraphNode[] {
    const subgraph = this.manager.findSubgraph(projectId, 3);
    const deps = subgraph.edges.filter(e => e.type === "DEPENDS_ON" || e.type === "BLOCKS");
    
    const nodeIds = new Set<string>();
    deps.forEach(e => { nodeIds.add(e.sourceId); nodeIds.add(e.targetId); });
    
    return Array.from(nodeIds).map(id => this.manager.findNode(id)).filter((n): n is GraphNode => n !== null);
  }

  findConflictingInformation(_nodeId: string): string[] {
    // Stub for advanced reasoning that scans properties of a node and its neighbors for conflicts
    return [];
  }
}

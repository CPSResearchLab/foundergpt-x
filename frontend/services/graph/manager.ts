import type { GraphNode, GraphEdge, Subgraph, NodeType, RelationshipType } from "./types";
import { NodeRepository, EdgeRepository } from "./repositories";

export class GraphManager {
  private nodeRepo = new NodeRepository();
  private edgeRepo = new EdgeRepository();

  // --- NODE OPERATIONS ---

  createNode(id: string, type: NodeType, label: string, properties: Record<string, unknown> = {}): GraphNode {
    return this.nodeRepo.createNode({ id, type, label, properties });
  }

  updateNode(id: string, properties: Record<string, unknown>): GraphNode | null {
    return this.nodeRepo.updateNode(id, { properties });
  }

  deleteNode(id: string): void {
    this.edgeRepo.deleteEdgesForNode(id);
    this.nodeRepo.deleteNode(id);
  }

  findNode(id: string): GraphNode | null {
    return this.nodeRepo.findNode(id);
  }

  findNodesByType(type: NodeType): GraphNode[] {
    return this.nodeRepo.findNodesByType(type);
  }

  // --- EDGE OPERATIONS ---

  createRelationship(sourceId: string, targetId: string, type: RelationshipType, confidence: number = 1.0, metadata: Record<string, unknown> = {}): GraphEdge {
    if (!this.nodeRepo.findNode(sourceId)) throw new Error(`Source node ${sourceId} not found`);
    if (!this.nodeRepo.findNode(targetId)) throw new Error(`Target node ${targetId} not found`);
    
    // Deduplication check
    const existing = this.edgeRepo.findEdgesBetween(sourceId, targetId, type);
    if (existing.length > 0) {
      const edge = existing[0];
      return this.edgeRepo.updateEdge(edge.id, { 
        confidence: Math.max(edge.confidence, confidence),
        metadata: { ...edge.metadata, ...metadata }
      })!;
    }
    
    return this.edgeRepo.createEdge({ sourceId, targetId, type, confidence, metadata });
  }

  deleteRelationship(id: string): boolean {
    return this.edgeRepo.deleteEdge(id);
  }

  // --- TRAVERSAL & SEARCH ---

  findNeighbors(nodeId: string): GraphNode[] {
    const edges = this.edgeRepo.findEdgesForNode(nodeId);
    const neighborIds = edges.map(e => e.sourceId === nodeId ? e.targetId : e.sourceId);
    return neighborIds.map(id => this.nodeRepo.findNode(id)).filter((n): n is GraphNode => n !== null);
  }

  findSubgraph(startNodeId: string, maxDepth: number = 2): Subgraph {
    const nodes = new Map<string, GraphNode>();
    const edges = new Map<string, GraphEdge>();
    
    const startNode = this.nodeRepo.findNode(startNodeId);
    if (!startNode) return { nodes: [], edges: [] };
    
    nodes.set(startNode.id, startNode);
    let currentFrontier = [startNodeId];
    
    for (let depth = 0; depth < maxDepth; depth++) {
      const nextFrontier: string[] = [];
      for (const nodeId of currentFrontier) {
        const nodeEdges = this.edgeRepo.findEdgesForNode(nodeId);
        for (const edge of nodeEdges) {
          edges.set(edge.id, edge);
          const neighborId = edge.sourceId === nodeId ? edge.targetId : edge.sourceId;
          if (!nodes.has(neighborId)) {
            const neighbor = this.nodeRepo.findNode(neighborId);
            if (neighbor) {
              nodes.set(neighbor.id, neighbor);
              nextFrontier.push(neighbor.id);
            }
          }
        }
      }
      currentFrontier = nextFrontier;
      if (currentFrontier.length === 0) break;
    }
    
    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values())
    };
  }

  findShortestPath(sourceId: string, targetId: string): GraphEdge[] | null {
    // Basic BFS for shortest path (unweighted)
    if (sourceId === targetId) return [];
    if (!this.nodeRepo.findNode(sourceId) || !this.nodeRepo.findNode(targetId)) return null;

    const visited = new Set<string>([sourceId]);
    const queue: { nodeId: string; path: GraphEdge[] }[] = [{ nodeId: sourceId, path: [] }];

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;
      const edges = this.edgeRepo.findEdgesForNode(nodeId);

      for (const edge of edges) {
        const neighborId = edge.sourceId === nodeId ? edge.targetId : edge.sourceId;
        if (neighborId === targetId) {
          return [...path, edge];
        }
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ nodeId: neighborId, path: [...path, edge] });
        }
      }
    }
    return null; // No path found
  }

  // --- DEDUPLICATION & MERGE ---

  mergeDuplicateNodes(primaryId: string, secondaryId: string): void {
    const primary = this.nodeRepo.findNode(primaryId);
    const secondary = this.nodeRepo.findNode(secondaryId);
    
    if (!primary || !secondary) return;

    // Merge properties
    this.updateNode(primaryId, {
      ...secondary.properties,
      ...primary.properties // Primary properties win
    });

    // Rewire edges
    const secondaryEdges = this.edgeRepo.findEdgesForNode(secondaryId);
    for (const edge of secondaryEdges) {
      const isSource = edge.sourceId === secondaryId;
      const newSource = isSource ? primaryId : edge.sourceId;
      const newTarget = !isSource ? primaryId : edge.targetId;
      
      this.createRelationship(newSource, newTarget, edge.type, edge.confidence, edge.metadata);
    }

    // Delete secondary
    this.deleteNode(secondaryId);
  }

  // --- EXPORT/IMPORT ---
  
  exportGraph(): Subgraph {
    return {
      nodes: this.nodeRepo.getAllNodes(),
      edges: this.edgeRepo.getAllEdges()
    };
  }

  importGraph(subgraph: Subgraph): void {
    for (const node of subgraph.nodes) {
      if (!this.nodeRepo.findNode(node.id)) {
        this.nodeRepo.createNode(node);
      }
    }
    for (const edge of subgraph.edges) {
      if (!this.edgeRepo.findEdge(edge.id)) {
        this.edgeRepo.createEdge(edge);
      }
    }
  }
}

export const graphManager = new GraphManager();

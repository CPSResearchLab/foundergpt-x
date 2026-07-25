import type { GraphNode, GraphEdge, NodeType, RelationshipType } from "./types";

export class NodeRepository {
  private nodes: Map<string, GraphNode> = new Map();

  createNode(node: Omit<GraphNode, "createdAt" | "updatedAt">): GraphNode {
    const now = new Date().toISOString();
    const newNode: GraphNode = {
      ...node,
      createdAt: now,
      updatedAt: now,
    };
    this.nodes.set(newNode.id, newNode);
    return newNode;
  }

  updateNode(id: string, updates: Partial<Omit<GraphNode, "id" | "createdAt" | "updatedAt">>): GraphNode | null {
    const node = this.nodes.get(id);
    if (!node) return null;
    
    const updated: GraphNode = {
      ...node,
      ...updates,
      properties: { ...node.properties, ...(updates.properties || {}) },
      updatedAt: new Date().toISOString()
    };
    this.nodes.set(id, updated);
    return updated;
  }

  deleteNode(id: string): boolean {
    return this.nodes.delete(id);
  }

  findNode(id: string): GraphNode | null {
    return this.nodes.get(id) || null;
  }

  findNodesByType(type: NodeType): GraphNode[] {
    return Array.from(this.nodes.values()).filter(n => n.type === type);
  }

  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }
}

export class EdgeRepository {
  private edges: Map<string, GraphEdge> = new Map();

  createEdge(edge: Omit<GraphEdge, "id" | "createdAt">): GraphEdge {
    const id = `edge_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newEdge: GraphEdge = {
      ...edge,
      id,
      createdAt: new Date().toISOString()
    };
    this.edges.set(id, newEdge);
    return newEdge;
  }

  updateEdge(id: string, updates: Partial<Pick<GraphEdge, "confidence" | "metadata">>): GraphEdge | null {
    const edge = this.edges.get(id);
    if (!edge) return null;
    
    const updated: GraphEdge = {
      ...edge,
      ...updates,
      metadata: { ...edge.metadata, ...(updates.metadata || {}) }
    };
    this.edges.set(id, updated);
    return updated;
  }

  deleteEdge(id: string): boolean {
    return this.edges.delete(id);
  }

  deleteEdgesForNode(nodeId: string): void {
    const toDelete = this.findEdgesForNode(nodeId).map(e => e.id);
    for (const id of toDelete) {
      this.edges.delete(id);
    }
  }

  findEdge(id: string): GraphEdge | null {
    return this.edges.get(id) || null;
  }

  findEdgesForNode(nodeId: string): GraphEdge[] {
    return Array.from(this.edges.values()).filter(e => e.sourceId === nodeId || e.targetId === nodeId);
  }

  findEdgesBetween(sourceId: string, targetId: string, type?: RelationshipType): GraphEdge[] {
    return Array.from(this.edges.values()).filter(e => 
      e.sourceId === sourceId && 
      e.targetId === targetId && 
      (type ? e.type === type : true)
    );
  }

  getAllEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }
}

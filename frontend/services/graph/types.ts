export type NodeType = 
  | "User" | "Organization" | "Company" | "Startup" | "Project" 
  | "Workspace" | "Document" | "Memory" | "Conversation" | "Research" 
  | "KnowledgeObject" | "Investor" | "Competitor" | "Market" | "Industry" 
  | "Technology" | "Framework" | "Product" | "Feature" | "Goal" 
  | "Task" | "Decision" | "Meeting" | "Idea" | "Roadmap" 
  | "Risk" | "Opportunity" | "Patent" | "Paper" | "Dataset" 
  | "Customer" | "Lead" | "Partner" | "Regulation" | "Tool" 
  | "Workflow" | "Prompt" | "Agent" | "Model";

export type RelationshipType = 
  | "OWNS" | "CREATED" | "GENERATED" | "USES" | "WORKS_ON" 
  | "RELATED_TO" | "PART_OF" | "REFERENCES" | "DEPENDS_ON" | "BLOCKS" 
  | "SUPPORTS" | "IMPLEMENTS" | "MENTIONS" | "LINKED_TO" | "CONNECTED_TO" 
  | "DERIVED_FROM" | "DISCOVERED_BY" | "COMPETES_WITH" | "INVESTED_IN" | "COLLABORATES_WITH" 
  | "BELONGS_TO" | "ASSIGNED_TO" | "PRODUCES" | "CONSUMES" | "LEARNS_FROM" 
  | "UPDATED_BY" | "SUPERSEDES";

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  confidence: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Subgraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

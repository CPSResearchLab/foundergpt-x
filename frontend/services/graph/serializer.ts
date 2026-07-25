import type { Subgraph } from "./types";

export class GraphSerializer {
  serializeToJson(subgraph: Subgraph): string {
    return JSON.stringify(subgraph, null, 2);
  }

  deserializeFromJson(json: string): Subgraph {
    return JSON.parse(json) as Subgraph;
  }

  serializeToContextString(subgraph: Subgraph): string {
    if (subgraph.nodes.length === 0) return "No graph context available.";

    let out = "GRAPH CONTEXT:\n\nNodes:\n";
    for (const node of subgraph.nodes) {
      out += `- [${node.type}] ${node.label} (ID: ${node.id})\n`;
      if (Object.keys(node.properties).length > 0) {
        out += `  Properties: ${JSON.stringify(node.properties)}\n`;
      }
    }

    out += "\nRelationships:\n";
    for (const edge of subgraph.edges) {
      const source = subgraph.nodes.find(n => n.id === edge.sourceId);
      const target = subgraph.nodes.find(n => n.id === edge.targetId);
      
      const sLabel = source ? source.label : edge.sourceId;
      const tLabel = target ? target.label : edge.targetId;
      
      out += `- ${sLabel} --[${edge.type}]--> ${tLabel} (Confidence: ${edge.confidence})\n`;
    }

    return out;
  }
}

export const graphSerializer = new GraphSerializer();

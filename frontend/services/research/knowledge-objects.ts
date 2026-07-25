import type { KnowledgeObject, KnowledgeObjectType, KnowledgeRelationship } from "./types";

export class KnowledgeObjectManager {
  private objects: Map<string, KnowledgeObject> = new Map();

  async createObject(
    type: KnowledgeObjectType,
    name: string,
    description: string,
    attributes: Record<string, unknown>,
    sources: string[],
    confidence: number
  ): Promise<KnowledgeObject> {
    const id = this.generateId(type);
    const now = new Date().toISOString();

    const obj: KnowledgeObject = {
      id,
      type,
      name,
      description,
      attributes,
      relationships: [],
      sources,
      confidence,
      createdAt: now,
      updatedAt: now,
    };

    this.objects.set(id, obj);
    return obj;
  }

  async addRelationship(
    sourceId: string,
    targetId: string,
    type: string,
    confidence: number,
    description?: string
  ): Promise<void> {
    const sourceObj = this.objects.get(sourceId);
    if (!sourceObj) throw new Error(`Knowledge object ${sourceId} not found`);

    const relationship: KnowledgeRelationship = {
      targetId,
      type,
      confidence,
      description,
    };

    sourceObj.relationships.push(relationship);
    sourceObj.updatedAt = new Date().toISOString();
  }

  async getObject(id: string): Promise<KnowledgeObject | undefined> {
    return this.objects.get(id);
  }

  async searchObjects(query: string, type?: KnowledgeObjectType): Promise<KnowledgeObject[]> {
    const results = Array.from(this.objects.values()).filter((obj) => {
      const matchType = type ? obj.type === type : true;
      const matchQuery =
        obj.name.toLowerCase().includes(query.toLowerCase()) ||
        obj.description.toLowerCase().includes(query.toLowerCase());
      return matchType && matchQuery;
    });

    return results;
  }

  private generateId(type: string): string {
    return `${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

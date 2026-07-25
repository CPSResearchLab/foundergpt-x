export type DocumentRelationshipType = "memory" | "project" | "goal" | "task" | "decision" | "chat";

export interface DocumentRelationship { documentId: string; type: DocumentRelationshipType; targetId: string; createdAt: string; }

export class DocumentRelationshipManager {
  private readonly relationships = new Map<string, Map<string, DocumentRelationship>>();
  link(documentId: string, type: DocumentRelationshipType, targetId: string): DocumentRelationship {
    const relationship = { documentId, type, targetId, createdAt: new Date().toISOString() };
    const values = this.relationships.get(documentId) ?? new Map<string, DocumentRelationship>();
    values.set(`${type}:${targetId}`, relationship); this.relationships.set(documentId, values); return structuredClone(relationship);
  }
  unlink(documentId: string, type: DocumentRelationshipType, targetId: string): boolean { return this.relationships.get(documentId)?.delete(`${type}:${targetId}`) ?? false; }
  list(documentId: string, type?: DocumentRelationshipType): DocumentRelationship[] { return [...(this.relationships.get(documentId)?.values() ?? [])].filter((value) => !type || value.type === type).map((value) => structuredClone(value)); }
  clear(documentId: string): void { this.relationships.delete(documentId); }
}

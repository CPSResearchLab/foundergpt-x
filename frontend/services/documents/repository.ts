import {
  clearDocumentChunks,
  deleteDocument,
  getChunksForDocument,
  getDocument,
  listStoredDocuments,
  saveChunks,
  saveDocument,
  updateStoredDocument,
} from "./store";
import type { DocumentChunk, StoredDocument } from "./types";

export interface DocumentRepository {
  save(document: StoredDocument): Promise<StoredDocument>;
  get(id: string): Promise<StoredDocument | null>;
  update(id: string, patch: Partial<StoredDocument>): Promise<StoredDocument | null>;
  delete(id: string): Promise<boolean>;
  list(projectId?: string): Promise<StoredDocument[]>;
  saveChunks(chunks: readonly DocumentChunk[]): Promise<void>;
  getChunks(documentId: string): Promise<DocumentChunk[]>;
  clearChunks(documentId: string): Promise<void>;
  findByHash(hash: string, projectId?: string): Promise<StoredDocument | null>;
}

export class LocalDocumentRepository implements DocumentRepository {
  async save(document: StoredDocument): Promise<StoredDocument> { return saveDocument(document); }
  async get(id: string): Promise<StoredDocument | null> { return getDocument(id); }
  async update(id: string, patch: Partial<StoredDocument>): Promise<StoredDocument | null> { return updateStoredDocument(id, patch); }
  async delete(id: string): Promise<boolean> {
    const deleted = deleteDocument(id);
    if (deleted) clearDocumentChunks(id);
    return deleted;
  }
  async list(projectId?: string): Promise<StoredDocument[]> { return listStoredDocuments(projectId); }
  async saveChunks(chunks: readonly DocumentChunk[]): Promise<void> { saveChunks([...chunks]); }
  async getChunks(documentId: string): Promise<DocumentChunk[]> { return getChunksForDocument(documentId).map((chunk) => structuredClone(chunk)); }
  async clearChunks(documentId: string): Promise<void> { clearDocumentChunks(documentId); }
  async findByHash(hash: string, projectId?: string): Promise<StoredDocument | null> {
    return (await this.list(projectId)).find((document) => document.hash === hash) ?? null;
  }
}

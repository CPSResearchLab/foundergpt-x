/**
 * Document Store
 *
 * In-process storage for StoredDocument records and DocumentChunks.
 * Server-side only (Node.js). Survives the process lifetime.
 *
 * In production this would be replaced by a database (e.g. DynamoDB, Postgres).
 * The interface is kept narrow so swapping the backend requires only this file.
 */

import type { DocumentChunk, DocumentListItem, StoredDocument } from "./types";

// ─── In-memory stores ─────────────────────────────────────────────────────────

const documentStore = new Map<string, StoredDocument>();
const chunkStore = new Map<string, DocumentChunk>(); // key: chunk.id
const chunksByDocument = new Map<string, string[]>(); // documentId → chunk ids

// ─── Documents ────────────────────────────────────────────────────────────────

export function saveDocument(doc: StoredDocument): StoredDocument {
  documentStore.set(doc.id, structuredClone(doc));
  return structuredClone(doc);
}

export function getDocument(id: string): StoredDocument | null {
  const doc = documentStore.get(id);
  return doc ? structuredClone(doc) : null;
}

export function updateDocument(id: string, patch: Partial<Pick<StoredDocument, "title" | "tags" | "updatedAt">>): StoredDocument | null {
  const doc = documentStore.get(id);
  if (!doc) return null;
  const updated: StoredDocument = { ...doc, ...patch, updatedAt: new Date().toISOString() };
  documentStore.set(id, updated);
  return structuredClone(updated);
}

export function deleteDocument(id: string): boolean {
  if (!documentStore.has(id)) return false;
  documentStore.delete(id);
  // Delete all associated chunks
  const chunkIds = chunksByDocument.get(id) ?? [];
  for (const cid of chunkIds) chunkStore.delete(cid);
  chunksByDocument.delete(id);
  return true;
}

export function listDocuments(projectId: string): DocumentListItem[] {
  return Array.from(documentStore.values())
    .filter((d) => d.projectId === projectId)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .map(toListItem);
}

export function listAllDocuments(): DocumentListItem[] {
  return Array.from(documentStore.values())
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .map(toListItem);
}

// ─── Chunks ───────────────────────────────────────────────────────────────────

export function saveChunks(chunks: DocumentChunk[]): void {
  for (const chunk of chunks) {
    chunkStore.set(chunk.id, structuredClone(chunk));
  }
  if (chunks.length > 0) {
    const docId = chunks[0].documentId;
    chunksByDocument.set(docId, chunks.map((c) => c.id));
  }
}

export function getChunksForDocument(documentId: string): DocumentChunk[] {
  const ids = chunksByDocument.get(documentId) ?? [];
  return ids
    .map((id) => chunkStore.get(id))
    .filter((c): c is DocumentChunk => c !== undefined)
    .sort((a, b) => a.index - b.index);
}

export function getChunksForProject(projectId: string): DocumentChunk[] {
  return Array.from(chunkStore.values()).filter((c) => c.projectId === projectId);
}

export function getAllChunks(): DocumentChunk[] {
  return Array.from(chunkStore.values());
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toListItem(doc: StoredDocument): DocumentListItem {
  return {
    id: doc.id,
    projectId: doc.projectId,
    filename: doc.filename,
    title: doc.title,
    fileType: doc.fileType,
    charCount: doc.charCount,
    chunkCount: doc.chunkCount,
    uploadedAt: doc.uploadedAt,
    updatedAt: doc.updatedAt,
    tags: doc.tags,
  };
}

import { parseDocument } from "./parser";
import { DocumentIndexer } from "./indexer";
import { MetadataExtractor } from "./metadata-extractor";
import { DocumentSearch, type DocumentSearchOptions } from "./search";
import { DocumentRelationshipManager, type DocumentRelationship, type DocumentRelationshipType } from "./relationships";
import { LocalDocumentRepository, type DocumentRepository } from "./repository";
import { SummaryEngine } from "./summary-engine";
import { memoryManager } from "../memory/memory-manager";
import type { DocumentFileType, DocumentMetadata, DocumentSearchResult, DocumentSummary, StoredDocument } from "./types";
import type { MemoryValue } from "../memory/types";

export interface UploadDocumentInput {
  id?: string;
  ownerId: string;
  projectId: string;
  filename: string;
  buffer: Buffer | Uint8Array;
  fileType?: DocumentFileType;
  mimeType?: string;
  tags?: readonly string[];
  createdAt?: string;
  modifiedAt?: string;
  chunkOptions?: { maxChunkSize?: number; overlap?: number };
  parentDocumentId?: string;
}

export interface DocumentUploadResult {
  document: StoredDocument;
  metadata: DocumentMetadata;
  summary: DocumentSummary;
  chunks: number;
  duplicate: boolean;
}

export interface ProjectDocumentView { recent: StoredDocument[]; pinned: StoredDocument[]; important: StoredDocument[]; }

export class DocumentManager {
  constructor(
    private readonly repository: DocumentRepository = new LocalDocumentRepository(),
    private readonly indexer = new DocumentIndexer(repository),
    private readonly metadataExtractor = new MetadataExtractor(),
    private readonly summaryEngine = new SummaryEngine(),
    private readonly searchEngine = new DocumentSearch(repository),
    private readonly relationships = new DocumentRelationshipManager(),
  ) {}

  async upload(input: UploadDocumentInput): Promise<DocumentUploadResult> {
    const buffer = Buffer.from(input.buffer);
    const fileType = input.fileType ?? inferFileType(input.filename, input.mimeType);
    const hash = contentHash(buffer);
    const duplicate = await this.repository.findByHash(hash, input.projectId);
    if (duplicate) {
      const metadata = duplicate.metadata ?? this.metadataExtractor.extract({ filename: duplicate.filename, fileType: duplicate.fileType, projectId: duplicate.projectId, fileSize: duplicate.fileSize ?? 0, contentHash: hash, text: duplicate.content ?? "", parseResult: { text: duplicate.content ?? "" } });
      const summary = duplicate.summary ?? this.summaryEngine.summarize(duplicate.content ?? "", metadata.entities);
      return { document: duplicate, metadata, summary, chunks: duplicate.chunkCount, duplicate: true };
    }
    const parseResult = await parseDocument(buffer, fileType);
    const text = parseResult.text;
    const metadata = this.metadataExtractor.extract({ filename: input.filename, fileType, projectId: input.projectId, fileSize: buffer.byteLength, contentHash: hash, text, parseResult, createdAt: input.createdAt, modifiedAt: input.modifiedAt, tags: input.tags });
    const summary = this.summaryEngine.summarize(text, metadata.entities);
    metadata.actionItems = summary.actionItems; metadata.questions = summary.questions; metadata.risks = summary.risks; metadata.goals = summary.goals; metadata.decisions = summary.decisions;
    const timestamp = new Date().toISOString();
    const document: StoredDocument = {
      id: input.id ?? createId(), projectId: input.projectId, ownerId: input.ownerId, filename: input.filename,
      title: metadata.title, fileType, charCount: text.length, chunkCount: 0, uploadedAt: timestamp, updatedAt: timestamp,
      tags: metadata.tags, content: text, fileSize: buffer.byteLength, hash, version: input.parentDocumentId ? ((await this.repository.get(input.parentDocumentId))?.version ?? 1) + 1 : 1, ...(input.parentDocumentId ? { parentDocumentId: input.parentDocumentId } : {}), isPinned: false, isImportant: summary.risks.length > 0,
      metadata, summary,
    };
    const saved = await this.repository.save(document);
    const indexed = await this.indexer.index({ document: saved, text, chunkOptions: input.chunkOptions });
    await this.createMemories(indexed.document, metadata, summary);
    return { document: indexed.document, metadata, summary, chunks: indexed.chunks.length, duplicate: false };
  }

  async get(id: string): Promise<StoredDocument | null> { return this.repository.get(id); }
  async delete(id: string): Promise<boolean> {
    const links = this.relationships.list(id, "memory");
    const deleted = await this.repository.delete(id);
    if (deleted) { for (const link of links) await memoryManager.delete(link.targetId); this.relationships.clear(id); }
    return deleted;
  }
  async rename(id: string, title: string): Promise<StoredDocument | null> { const document = await this.repository.update(id, { title: title.trim() }); if (document) await this.updateDocumentMemory(document); return document; }
  async move(id: string, projectId: string): Promise<StoredDocument | null> { const document = await this.repository.update(id, { projectId }); if (document) { await this.updateDocumentMemory(document); for (const link of this.relationships.list(id, "memory")) await memoryManager.update(link.targetId, { projectId }); } return document; }
  async setPinned(id: string, isPinned: boolean): Promise<StoredDocument | null> { return this.repository.update(id, { isPinned }); }
  async setImportant(id: string, isImportant: boolean): Promise<StoredDocument | null> { return this.repository.update(id, { isImportant }); }
  async createVersion(id: string, input: Omit<UploadDocumentInput, "projectId" | "ownerId"> & { ownerId?: string; projectId?: string }): Promise<DocumentUploadResult | null> {
    const parent = await this.repository.get(id); if (!parent) return null;
    return this.upload({ ...input, ownerId: input.ownerId ?? parent.ownerId, projectId: input.projectId ?? parent.projectId, filename: input.filename ?? parent.filename, buffer: input.buffer, modifiedAt: input.modifiedAt, tags: input.tags ?? parent.tags, parentDocumentId: id });
  }
  async getMetadata(id: string): Promise<DocumentMetadata | null> { return (await this.repository.get(id))?.metadata ?? null; }
  async metadata(id: string): Promise<DocumentMetadata | null> { return this.getMetadata(id); }
  async preview(id: string, maxCharacters = 4000): Promise<string | null> { const document = await this.repository.get(id); return document ? (document.content ?? "").slice(0, Math.max(0, maxCharacters)) : null; }
  async search(options: DocumentSearchOptions): Promise<DocumentSearchResult[]> { return this.searchEngine.search(options); }
  async version(id: string, input: Omit<UploadDocumentInput, "projectId" | "ownerId"> & { ownerId?: string; projectId?: string }): Promise<DocumentUploadResult | null> { return this.createVersion(id, input); }
  async listProjectDocuments(projectId: string): Promise<ProjectDocumentView> { const documents = await this.repository.list(projectId); return { recent: documents.slice(0, 10), pinned: documents.filter((document) => document.isPinned), important: documents.filter((document) => document.isImportant || (document.metadata?.risks.length ?? 0) > 0) }; }
  link(documentId: string, type: DocumentRelationshipType, targetId: string): DocumentRelationship { return this.relationships.link(documentId, type, targetId); }
  unlink(documentId: string, type: DocumentRelationshipType, targetId: string): boolean { return this.relationships.unlink(documentId, type, targetId); }
  relationshipsFor(documentId: string): DocumentRelationship[] { return this.relationships.list(documentId); }

  private async updateDocumentMemory(document: StoredDocument): Promise<void> {
    const link = this.relationships.list(document.id, "memory")[0];
    if (link) await memoryManager.update(link.targetId, { title: document.title, projectId: document.projectId });
  }
  private async createMemories(document: StoredDocument, metadata: DocumentMetadata, summary: DocumentSummary): Promise<void> {
    const baseMetadata: Readonly<Record<string, MemoryValue>> = { documentId: document.id, filename: document.filename, entities: metadata.entities.map((entity) => ({ type: entity.type, value: entity.value })), keywords: metadata.keywords };
    const documentMemory = await memoryManager.save({ id: `document-memory-${document.id}`, type: "DOCUMENT", projectId: document.projectId, title: document.title, summary: summary.short, content: document.content ?? summary.long, tags: document.tags, importance: document.isImportant ? 0.9 : 0.7, source: `document:${document.id}`, metadata: baseMetadata });
    this.relationships.link(document.id, "memory", documentMemory.id); this.relationships.link(document.id, "project", document.projectId);
    const summaryMemory = await memoryManager.save({ id: `document-summary-${document.id}`, type: "NOTE", projectId: document.projectId, title: `${document.title} summary`, summary: summary.short, content: summary.long, tags: summary.topics, importance: 0.8, source: `document:${document.id}`, metadata: baseMetadata });
    this.relationships.link(document.id, "memory", summaryMemory.id);
    const extracted = [
      ...summary.actionItems.map((value) => ({ type: "TASK" as const, value })),
      ...summary.goals.map((value) => ({ type: "GOAL" as const, value })),
      ...summary.decisions.map((value) => ({ type: "DECISION" as const, value })),
      ...metadata.entities.filter((entity) => entity.type === "research-paper").map((entity) => ({ type: "RESEARCH" as const, value: entity.value })),
    ];
    for (let index = 0; index < extracted.length; index++) {
      const item = extracted[index];
      const memory = await memoryManager.save({ id: `document-${item.type.toLowerCase()}-${document.id}-${index}`, type: item.type, projectId: document.projectId, title: item.value, summary: item.value, content: item.value, tags: ["document-extracted", item.type.toLowerCase()], importance: 0.7, source: `document:${document.id}`, metadata: { ...baseMetadata, extractionType: item.type } });
      this.relationships.link(document.id, "memory", memory.id);
    }
  }
}

function inferFileType(filename: string, mimeType?: string): DocumentFileType { const extension = filename.toLocaleLowerCase().split(".").pop() ?? "txt"; if (mimeType?.startsWith("image/")) return "image"; if (["pdf", "docx", "txt", "md", "csv", "pptx", "json", "html"].includes(extension)) return extension as DocumentFileType; return ["js", "ts", "tsx", "jsx", "css", "py", "java", "go", "rs"].includes(extension) ? "code" : "txt"; }
function contentHash(buffer: Buffer): string { let hash = 2166136261; for (const byte of buffer) { hash ^= byte; hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(16).padStart(8, "0"); }
function createId(): string { return globalThis.crypto?.randomUUID?.() ?? `document_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`; }

export const documentManager = new DocumentManager();

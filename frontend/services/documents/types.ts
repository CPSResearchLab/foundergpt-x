// ─── Supported file types ─────────────────────────────────────────────────────

export type SupportedMimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "text/plain"
  | "text/markdown"
  | "text/csv"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export type DocumentFileType = "pdf" | "docx" | "txt" | "md" | "csv" | "pptx";

export const MIME_TO_TYPE: Record<string, DocumentFileType> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "text/markdown": "md",
  "text/csv": "csv",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

export const ACCEPTED_EXTENSIONS = ".pdf,.docx,.txt,.md,.csv,.pptx";
export const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

// ─── Core document record ─────────────────────────────────────────────────────

/** Full document record stored in the document store. */
export interface StoredDocument {
  id: string;
  projectId: string;
  ownerId: string;
  /** Original filename as uploaded. */
  filename: string;
  /** User-editable display title. */
  title: string;
  fileType: DocumentFileType;
  /** Total character count of extracted text. */
  charCount: number;
  /** Number of chunks produced. */
  chunkCount: number;
  uploadedAt: string;
  updatedAt: string;
  /** Tags derived from content. */
  tags: string[];
}

// ─── Document chunk ───────────────────────────────────────────────────────────

/** A single chunk of a document with its embedding and metadata. */
export interface DocumentChunk {
  id: string;
  documentId: string;
  projectId: string;
  /** Zero-based position within the document. */
  index: number;
  /** Raw text of this chunk. */
  text: string;
  /** Character offset where this chunk starts in the full document. */
  charOffset: number;
  /** TF-IDF-style keyword tokens for keyword search. */
  keywords: string[];
  /** Embedding vector (provider-agnostic float array). Empty until generated. */
  embedding: number[];
  createdAt: string;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export type SearchMode = "semantic" | "keyword" | "hybrid";

export interface DocumentSearchResult {
  chunk: DocumentChunk;
  document: StoredDocument;
  /** Combined relevance score 0–1. */
  score: number;
  /** How the score was computed. */
  mode: SearchMode;
}

// ─── API shapes ───────────────────────────────────────────────────────────────

export interface DocumentListItem {
  id: string;
  projectId: string;
  filename: string;
  title: string;
  fileType: DocumentFileType;
  charCount: number;
  chunkCount: number;
  uploadedAt: string;
  updatedAt: string;
  tags: string[];
}

export interface UploadDocumentResponse {
  document: DocumentListItem;
}

export interface RenameDocumentResponse {
  document: DocumentListItem;
}

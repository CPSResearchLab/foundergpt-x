// ─── Supported file types ─────────────────────────────────────────────────────

export type SupportedMimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "text/plain"
  | "text/markdown"
  | "text/csv"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  | "application/json"
  | "text/html"
  | "text/css"
  | "text/javascript"
  | "application/javascript"
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/gif";

export type DocumentFileType = "pdf" | "docx" | "txt" | "md" | "csv" | "pptx" | "json" | "code" | "html" | "image";

export const MIME_TO_TYPE: Record<string, DocumentFileType> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "text/markdown": "md",
  "text/csv": "csv",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/json": "json",
  "text/html": "html",
  "text/css": "code",
  "text/javascript": "code",
  "application/javascript": "code",
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "image/gif": "image",
};

export const ACCEPTED_EXTENSIONS = ".pdf,.docx,.txt,.md,.csv,.pptx,.json,.html,.js,.ts,.tsx,.jsx,.css,.py,.java,.go,.rs,.png,.jpg,.jpeg,.webp,.gif";
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
  /** Optional extracted text retained for local preview and re-indexing. */
  content?: string;
  fileSize?: number;
  hash?: string;
  version?: number;
  parentDocumentId?: string;
  isPinned?: boolean;
  isImportant?: boolean;
  metadata?: DocumentMetadata;
  summary?: DocumentSummary;
}

export interface DocumentEntity {
  type: "company" | "person" | "product" | "technology" | "investor" | "competitor" | "research-paper" | "date" | "number" | "url" | "email" | "phone";
  value: string;
}

export interface DocumentMetadata {
  title: string;
  author?: string;
  pageCount?: number;
  fileSize: number;
  creationDate?: string;
  modifiedDate?: string;
  keywords: string[];
  language: string;
  projectId: string;
  tags: string[];
  entities: DocumentEntity[];
  topics: string[];
  actionItems: string[];
  questions: string[];
  risks: string[];
  goals?: string[];
  decisions?: string[];
  contentHash: string;
  sourceFilename: string;
}

export interface DocumentSummary {
  short: string;
  long: string;
  keywords: string[];
  topics: string[];
  importantEntities: DocumentEntity[];
  actionItems: string[];
  questions: string[];
  risks: string[];
  goals: string[];
  decisions: string[];
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
  heading?: string;
  sectionPath?: string[];
  pageNumber?: number;
  paragraphIndex?: number;
  tokenCount?: number;
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
  reasonMatched?: string;
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

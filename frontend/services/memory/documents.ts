import {
  deleteMemory,
  getMemory,
  saveMemory,
  searchMemory,
  updateMemory,
  type MemoryUpdate,
} from "./memory";
import type { DocumentAuthor, DocumentMemory, DocumentType } from "./types";

const DOCUMENT_COLLECTION = "documents";

export interface CreateDocumentMemoryInput {
  id?: string;
  ownerId: string;
  projectId: string;
  title: string;
  type: DocumentType;
  content: string;
  tags?: readonly string[];
  author: DocumentAuthor;
}

export const createDocumentMemory = async (
  input: CreateDocumentMemoryInput,
): Promise<DocumentMemory> => {
  const timestamp = new Date().toISOString();
  const document: DocumentMemory = {
    id: input.id ?? crypto.randomUUID(),
    ownerId: input.ownerId,
    projectId: input.projectId,
    title: input.title,
    type: input.type,
    content: input.content,
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1,
    tags: input.tags ?? [],
    author: input.author,
  };

  return saveMemory(DOCUMENT_COLLECTION, document);
};

export const getDocumentMemory = (documentId: string): Promise<DocumentMemory | null> =>
  getMemory<DocumentMemory>(DOCUMENT_COLLECTION, documentId);

export const updateDocumentMemory = async (
  documentId: string,
  update: MemoryUpdate<DocumentMemory>,
): Promise<DocumentMemory | null> => {
  const existingDocument = await getDocumentMemory(documentId);
  if (!existingDocument) {
    return null;
  }

  return updateMemory<DocumentMemory>(DOCUMENT_COLLECTION, documentId, {
    ...update,
    version: update.content === undefined ? existingDocument.version : existingDocument.version + 1,
  });
};

export const deleteDocumentMemory = (documentId: string): Promise<boolean> =>
  deleteMemory(DOCUMENT_COLLECTION, documentId);

export const searchDocumentMemory = (
  query: string,
  projectId?: string,
): Promise<DocumentMemory[]> =>
  searchMemory<DocumentMemory>(DOCUMENT_COLLECTION, {
    text: query,
    predicate: (document) => !projectId || document.projectId === projectId,
  });

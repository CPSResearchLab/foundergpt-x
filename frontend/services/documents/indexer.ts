import { ChunkEngine, type ChunkOptions } from "./chunk-engine";
import { LocalDocumentRepository, type DocumentRepository } from "./repository";
import type { DocumentChunk, StoredDocument } from "./types";

export interface DocumentIndexInput {
  document: StoredDocument;
  text: string;
  chunkOptions?: ChunkOptions;
}

export interface DocumentIndexResult {
  document: StoredDocument;
  chunks: readonly DocumentChunk[];
}

export class DocumentIndexer {
  constructor(private readonly repository: DocumentRepository = new LocalDocumentRepository(), private readonly chunkEngine = new ChunkEngine()) {}

  async index(input: DocumentIndexInput): Promise<DocumentIndexResult> {
    await this.repository.clearChunks(input.document.id);
    const chunks = this.chunkEngine.chunk(input.document.id, input.document.projectId, input.text, input.chunkOptions);
    await this.repository.saveChunks(chunks);
    const document = await this.repository.update(input.document.id, { chunkCount: chunks.length, content: input.text });
    return { document: document ?? input.document, chunks };
  }
}

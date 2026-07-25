import type { DocumentRepository } from "./repository";
import { LocalDocumentRepository } from "./repository";
import type { DocumentFileType, DocumentSearchResult } from "./types";

export interface DocumentSearchOptions {
  query: string;
  projectId?: string;
  fileType?: DocumentFileType;
  tags?: readonly string[];
  limit?: number;
  minScore?: number;
}

export class DocumentSearch {
  constructor(private readonly repository: DocumentRepository = new LocalDocumentRepository()) {}

  async search(options: DocumentSearchOptions): Promise<DocumentSearchResult[]> {
    const documents = await this.repository.list(options.projectId);
    const queryTokens = tokens(options.query);
    const results: DocumentSearchResult[] = [];
    for (const document of documents) {
      if (options.fileType && document.fileType !== options.fileType) continue;
      if (options.tags?.length && !options.tags.every((tag) => document.tags.includes(tag.toLowerCase()))) continue;
      const chunks = await this.repository.getChunks(document.id);
      const candidates = chunks.length ? chunks : [{ id: `${document.id}-full`, documentId: document.id, projectId: document.projectId, index: 0, text: document.content ?? document.summary?.long ?? "", charOffset: 0, keywords: document.metadata?.keywords ?? [], embedding: [], createdAt: document.updatedAt }];
      for (const chunk of candidates) {
        const titleScore = overlap(queryTokens, `${document.title} ${document.filename}`);
        const metadataScore = overlap(queryTokens, `${document.tags.join(" ")} ${(document.metadata?.keywords ?? []).join(" ")} ${(document.metadata?.topics ?? []).join(" ")} ${(document.metadata?.entities ?? []).map((entity) => entity.value).join(" ")}`);
        const contentScore = overlap(queryTokens, `${chunk.text} ${(chunk.keywords ?? []).join(" ")}`);
        const projectScore = options.projectId && document.projectId === options.projectId ? 1 : 0;
        const score = titleScore * 0.3 + metadataScore * 0.25 + contentScore * 0.35 + projectScore * 0.1;
        if (score >= (options.minScore ?? 0.01)) results.push({ chunk, document, score, mode: "keyword", reasonMatched: reason(titleScore, metadataScore, contentScore, projectScore) });
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, Math.min(100, Math.max(0, options.limit ?? 8)));
  }
}

function tokens(value: string): Set<string> { return new Set(value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/u).filter((token) => token.length > 2)); }
function overlap(query: Set<string>, value: string): number { if (!query.size) return 0; const valueTokens = tokens(value); let count = 0; for (const token of query) if (valueTokens.has(token)) count++; return count / query.size; }
function reason(title: number, metadata: number, content: number, project: number): string { const matches = [title > 0 && "title/filename", metadata > 0 && "metadata", content > 0 && "content", project > 0 && "project"].filter((value): value is string => Boolean(value)); return matches.length ? `Matched by ${matches.join(", ")}.` : "Keyword match."; }

/**
 * Document Retrieval
 *
 * Three search modes:
 *   semantic  — cosine similarity on embeddings
 *   keyword   — keyword overlap (BM25-inspired token matching)
 *   hybrid    — weighted average of semantic + keyword scores (0.6 / 0.4)
 *
 * All modes return DocumentSearchResult[] sorted by score descending.
 */

import { cosineSimilarity, embedQuery } from "./embeddings";
import { getChunksForProject, getDocument } from "./store";
import type { DocumentChunk, DocumentSearchResult, SearchMode, StoredDocument } from "./types";

const HYBRID_SEMANTIC_WEIGHT = 0.6;
const HYBRID_KEYWORD_WEIGHT = 0.4;

// ─── Public API ───────────────────────────────────────────────────────────────

export interface RetrieveOptions {
  projectId: string;
  query: string;
  mode?: SearchMode;
  limit?: number;
  /** Minimum score threshold (0–1). Default: 0.05 */
  minScore?: number;
}

export async function retrieveDocumentChunks(options: RetrieveOptions): Promise<DocumentSearchResult[]> {
  const { projectId, query, mode = "hybrid", limit = 8, minScore = 0.05 } = options;

  const chunks = getChunksForProject(projectId);
  if (chunks.length === 0) return [];

  let results: DocumentSearchResult[];

  switch (mode) {
    case "semantic":
      results = await semanticSearch(query, chunks, projectId);
      break;
    case "keyword":
      results = keywordSearch(query, chunks, projectId);
      break;
    case "hybrid":
    default:
      results = await hybridSearch(query, chunks, projectId);
  }

  return results
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ─── Semantic search ──────────────────────────────────────────────────────────

async function semanticSearch(
  query: string,
  chunks: DocumentChunk[],
  projectId: string,
): Promise<DocumentSearchResult[]> {
  const queryVec = await embedQuery(query);
  return chunks
    .filter((c) => c.embedding.length > 0)
    .map((chunk) => {
      const score = cosineSimilarity(queryVec, chunk.embedding);
      return toResult(chunk, projectId, score, "semantic");
    })
    .filter((r): r is DocumentSearchResult => r !== null);
}

// ─── Keyword search ───────────────────────────────────────────────────────────

function keywordSearch(
  query: string,
  chunks: DocumentChunk[],
  projectId: string,
): DocumentSearchResult[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  return chunks.map((chunk) => {
    const chunkTokens = new Set(chunk.keywords);
    const matches = queryTokens.filter((t) => chunkTokens.has(t)).length;
    const score = matches / queryTokens.length;
    return toResult(chunk, projectId, score, "keyword");
  }).filter((r): r is DocumentSearchResult => r !== null);
}

// ─── Hybrid search ────────────────────────────────────────────────────────────

async function hybridSearch(
  query: string,
  chunks: DocumentChunk[],
  projectId: string,
): Promise<DocumentSearchResult[]> {
  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch(query, chunks, projectId),
    Promise.resolve(keywordSearch(query, chunks, projectId)),
  ]);

  // Merge by chunk id
  const scoreMap = new Map<string, { semantic: number; keyword: number; chunk: DocumentChunk }>();

  for (const r of semanticResults) {
    scoreMap.set(r.chunk.id, { semantic: r.score, keyword: 0, chunk: r.chunk });
  }
  for (const r of keywordResults) {
    const existing = scoreMap.get(r.chunk.id);
    if (existing) {
      existing.keyword = r.score;
    } else {
      scoreMap.set(r.chunk.id, { semantic: 0, keyword: r.score, chunk: r.chunk });
    }
  }

  return Array.from(scoreMap.values()).map(({ semantic, keyword, chunk }) => {
    const score = semantic * HYBRID_SEMANTIC_WEIGHT + keyword * HYBRID_KEYWORD_WEIGHT;
    return toResult(chunk, projectId, score, "hybrid");
  }).filter((r): r is DocumentSearchResult => r !== null);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toResult(
  chunk: DocumentChunk,
  _projectId: string,
  score: number,
  mode: SearchMode,
): DocumentSearchResult | null {
  const document = getDocument(chunk.documentId) as StoredDocument | null;
  if (!document) return null;
  return { chunk, document, score, mode };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

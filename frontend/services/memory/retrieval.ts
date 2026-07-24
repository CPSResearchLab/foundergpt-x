/**
 * Memory Retrieval
 *
 * Retrieves and ranks MessageMemoryRecords for a given query and project.
 *
 * Ranking formula:
 *   score = (recencyScore × 0.5) + (relevanceScore × 0.5)
 *
 * recencyScore: exponential decay — messages from the last hour score ~1.0,
 *               messages from 30 days ago score ~0.05.
 *
 * relevanceScore: keyword overlap between the query tokens and the record
 *                 content + entity fields.
 */

import type { MemorySearchResult, ChatMessageEntry, RetrievedMemoryContext } from "./types";
import { getProjectRecords, getSessionRecords } from "./store";
import { createMemoryStore } from "./memory-store";
import { rankMemories } from "./ranking";

const chatMemoryStore = createMemoryStore("chat_messages");

// ─── Scoring ─────────────────────────────────────────────────────────────────

const RECENCY_HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function recencyScore(createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return Math.exp((-Math.LN2 * ageMs) / RECENCY_HALF_LIFE_MS);
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );
}

function relevanceScore(query: string, content: string, entityText: string): number {
  const queryTokens = tokenize(query);
  if (queryTokens.size === 0) return 0.5; // no query → neutral score

  const contentTokens = tokenize(content + " " + entityText);
  let matches = 0;
  for (const token of queryTokens) {
    if (contentTokens.has(token)) matches++;
  }
  return matches / queryTokens.size;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface RetrievalOptions {
  projectId: string;
  query: string;
  /** Maximum number of results to return. Default: 10. */
  limit?: number;
  /** Exclude records from this session (they are already in recentMessages). */
  excludeSessionId?: string;
  /** Minimum combined score threshold (0–1). Default: 0.05. */
  minScore?: number;
}

/** Retrieve and rank memory records relevant to a query for a given project. */
export function retrieveRelevantMemory(options: RetrievalOptions): MemorySearchResult[] {
  const { projectId, query, limit = 10, excludeSessionId, minScore = 0.05 } = options;

  const records = getProjectRecords(projectId).filter(
    (r) => !excludeSessionId || r.sessionId !== excludeSessionId,
  );

  const results: MemorySearchResult[] = records.map((record) => {
    const entityText = [
      ...record.entities.founderNames,
      ...record.entities.companyNames,
      ...record.entities.industries,
      ...record.entities.targetCustomers,
      ...record.entities.technologies,
      ...record.entities.competitors,
      ...record.entities.goals,
      ...record.entities.decisions,
    ].join(" ");

    const rScore = recencyScore(record.createdAt);
    const relScore = relevanceScore(query, record.content, entityText);
    const score = rScore * 0.5 + relScore * 0.5;

    return { record, score };
  });

  return results
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Retrieve the N most recent messages from a session (chronological order). */
export function getRecentSessionMessages(
  sessionId: string,
  limit = 20,
): ReturnType<typeof getSessionRecords> {
  return getSessionRecords(sessionId).slice(-limit);
}

export interface RetrieveMemoryContextOptions {
  userId: string;
  projectId: string;
  chatId: string;
  /** Current user message — used to sharpen project relevance scoring. */
  query?: string;
  /** Max candidates fetched per bucket before ranking. Default: 100. */
  fetchLimit?: number;
  /** Max ranked results returned per bucket. Default: 20. */
  resultLimit?: number;
}

/**
 * Retrieve structured memory context before every AI request.
 * Fetches ChatMessageEntry records from MemoryStore, ranks each bucket
 * by recency, importance, and project relevance, and returns only the best.
 */
export async function retrieveMemoryContext(
  options: RetrieveMemoryContextOptions,
): Promise<RetrievedMemoryContext> {
  const {
    userId,
    projectId,
    chatId,
    query,
    fetchLimit = 100,
    resultLimit = 20,
  } = options;

  const [rawRecent, rawProject, rawHistory] = await Promise.all([
    chatMemoryStore.searchMemory<ChatMessageEntry>({
      predicate: (e) => e.userId === userId,
      limit: fetchLimit,
    }),
    chatMemoryStore.searchMemory<ChatMessageEntry>({
      predicate: (e) => e.projectId === projectId,
      limit: fetchLimit,
    }),
    chatMemoryStore.searchMemory<ChatMessageEntry>({
      predicate: (e) => e.chatId === chatId,
      limit: fetchLimit,
    }),
  ]);

  return {
    recentMemories: rankMemories(rawRecent, {
      projectId,
      query,
      limit: resultLimit,
      sortBy: "score",
    }),
    projectMemories: rankMemories(rawProject, {
      projectId,
      query,
      limit: resultLimit,
      sortBy: "score",
    }),
    chatHistory: rankMemories(rawHistory, {
      projectId,
      query,
      limit: resultLimit,
      sortBy: "chronological",
    }),
  };
}

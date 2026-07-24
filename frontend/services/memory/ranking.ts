/**
 * Memory Ranking
 *
 * Scores ChatMessageEntry records across three signals:
 *
 *   recency          — exponential decay (half-life: 7 days)
 *   importance       — entity density + high-signal keyword presence
 *   projectRelevance — keyword overlap between message and project context
 *
 * Final score = recency×0.35 + importance×0.35 + projectRelevance×0.30
 *
 * Only entries above the score threshold are returned, capped at `limit`.
 */

import type { ChatMessageEntry, RankedMemory } from "./types";

const HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Keywords that signal a high-importance message
const IMPORTANCE_SIGNALS = [
  "decide", "decided", "decision",
  "goal", "milestone", "deadline",
  "fund", "funding", "invest", "investor", "raise",
  "launch", "ship", "release",
  "problem", "blocker", "issue", "risk",
  "hire", "hiring", "team",
  "pivot", "strategy", "vision", "mission",
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function scoreRecency(timestamp: string): number {
  const ageMs = Date.now() - new Date(timestamp).getTime();
  return Math.exp((-Math.LN2 * ageMs) / HALF_LIFE_MS);
}

function scoreImportance(message: string): number {
  const tokens = tokenize(message);
  if (tokens.length === 0) return 0;

  const signalSet = new Set(IMPORTANCE_SIGNALS);
  const hits = tokens.filter((t) => signalSet.has(t)).length;

  // Normalise: 3+ signal hits → score 1.0; scale linearly below that
  const density = Math.min(hits / 3, 1);

  // Boost longer messages slightly (more content = more context)
  const lengthBoost = Math.min(message.length / 500, 1) * 0.2;

  return Math.min(density + lengthBoost, 1);
}

function scoreProjectRelevance(message: string, projectId: string, query?: string): number {
  const tokens = new Set(tokenize(message));
  const targets = tokenize(projectId + " " + (query ?? ""));
  if (targets.length === 0) return 0.5; // no signal → neutral

  const hits = targets.filter((t) => tokens.has(t)).length;
  return Math.min(hits / targets.length, 1);
}

export interface RankOptions {
  projectId: string;
  /** Optional current message used to boost project relevance scoring. */
  query?: string;
  /** Minimum composite score to include. Default: 0.1 */
  minScore?: number;
  /** Maximum entries to return. Default: 20 */
  limit?: number;
  /** Sort order for the returned slice. Default: "score" */
  sortBy?: "score" | "recency" | "chronological";
}

/** Rank a set of ChatMessageEntry records and return only the best. */
export function rankMemories(entries: ChatMessageEntry[], options: RankOptions): RankedMemory[] {
  const { projectId, query, minScore = 0.1, limit = 20, sortBy = "score" } = options;

  const ranked: RankedMemory[] = entries.map((entry) => {
    const recencyScore = scoreRecency(entry.timestamp);
    const importanceScore = scoreImportance(entry.message);
    const projectRelevanceScore = scoreProjectRelevance(entry.message, projectId, query);

    // Pinned entries receive a flat +0.3 boost, capped at 1.0
    const pinnedBoost = (entry as { pinned?: boolean }).pinned ? 0.3 : 0;
    const score = Math.min(
      recencyScore * 0.35 +
      importanceScore * 0.35 +
      projectRelevanceScore * 0.30 +
      pinnedBoost,
      1,
    );

    return { entry, recencyScore, importanceScore, projectRelevanceScore, score };
  });

  const filtered = ranked.filter((r) => r.score >= minScore);

  if (sortBy === "recency") {
    filtered.sort((a, b) => b.recencyScore - a.recencyScore);
  } else if (sortBy === "chronological") {
    filtered.sort(
      (a, b) =>
        new Date(a.entry.timestamp).getTime() - new Date(b.entry.timestamp).getTime(),
    );
  } else {
    filtered.sort((a, b) => b.score - a.score);
  }

  return filtered.slice(0, limit);
}

/**
 * FounderGPT's provider-independent memory boundary.
 *
 * The default backend is localStorage in a browser and an in-process map on
 * the server.  The MemoryBackend interface is the only persistence seam a
 * future Amplify/DynamoDB adapter needs to implement.
 */

import type { MemoryValue } from "./types";

export const MEMORY_TYPES = [
  "USER", "PROJECT", "COMPANY", "CHAT", "DOCUMENT", "RESEARCH", "TASK",
  "GOAL", "DECISION", "MEETING", "PRODUCT", "INVESTOR", "COMPETITOR", "NOTE", "IDEA",
] as const;

export type MemoryCategory = (typeof MEMORY_TYPES)[number];
/** Legacy aliases remain accepted so existing extracted knowledge is not lost. */
export type LegacyMemoryType =
  | "founder" | "company" | "project" | "document" | "chat" | "goal" | "task"
  | "deadline" | "business-decision" | "investor-note" | "competitor"
  | "product-feature" | "research";
export type MemoryType = MemoryCategory | LegacyMemoryType;

export interface Memory {
  id: string;
  type: MemoryType;
  projectId: string;
  title: string;
  summary: string;
  content: string;
  tags: readonly string[];
  /** Normalized 0..1 importance. */
  importance: number;
  createdAt: string;
  updatedAt: string;
  lastAccessed: string;
  accessCount: number;
  source: string;
  metadata: Readonly<Record<string, MemoryValue>>;
}

export type MemoryInput = Omit<Memory, "id" | "createdAt" | "updatedAt" | "lastAccessed" | "accessCount" | "title" | "summary" | "tags" | "metadata"> & {
  id?: string;
  title?: string;
  summary?: string;
  tags?: readonly string[];
  metadata?: Readonly<Record<string, MemoryValue>>;
  createdAt?: string;
  updatedAt?: string;
  lastAccessed?: string;
  accessCount?: number;
};

export type MemoryUpdate = Partial<Pick<Memory, "type" | "projectId" | "title" | "summary" | "content" | "importance" | "tags" | "source" | "metadata">>;

export interface MemoryListOptions {
  projectId?: string;
  types?: readonly MemoryType[];
  limit?: number;
}

export interface MemorySearchOptions extends MemoryListOptions {
  /** Additional tag filters; all supplied tags must be present. */
  tags?: readonly string[];
}

export interface RelevantMemoryOptions extends MemorySearchOptions {
  minScore?: number;
}

export interface MemorySearchResult {
  memory: Memory;
  score: number;
  confidence: number;
  reasonMatched: string;
  breakdown: {
    importance: number;
    recency: number;
    accessFrequency: number;
    projectMatch: number;
    titleSimilarity: number;
    keywordSimilarity: number;
    tagSimilarity: number;
    contentSimilarity: number;
  };
}

export interface MemoryBackend {
  list(): Promise<Memory[]>;
  save(memory: Memory): Promise<Memory>;
  update(id: string, patch: MemoryUpdate): Promise<Memory | null>;
  get(id: string): Promise<Memory | null>;
  delete(id: string): Promise<boolean>;
  clear(): Promise<void>;
  importMemories(memories: readonly Memory[]): Promise<number>;
}

const STORAGE_KEY = "foundergpt_memory_brain_v1";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;
const RECENCY_HALF_LIFE_MS = 30 * 24 * 60 * 60 * 1000;
const STOP_WORDS = new Set(["the", "and", "for", "with", "that", "this", "from", "have", "will", "into", "your", "about", "are", "was", "were"]);

const serverStore = new Map<string, Memory>();

function clone<T>(value: T): T { return structuredClone(value); }
function isClient(): boolean { return typeof window !== "undefined"; }
function now(): string { return new Date().toISOString(); }
function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `memory_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
function normalizeTags(tags: readonly string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}
function normalizeImportance(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5;
}
function tokenize(value: string): Set<string> {
  return new Set(value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((token) => token.length > 2 && !STOP_WORDS.has(token)));
}
function deriveKeywords(content: string): string[] {
  const counts = new Map<string, number>();
  for (const token of tokenize(content)) counts.set(token, (counts.get(token) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12).map(([token]) => token);
}
function deterministicSummary(content: string): string {
  const clean = content.replace(/\s+/g, " ").trim();
  return clean.length <= 240 ? clean : `${clean.slice(0, 237).trimEnd()}...`;
}
function normalizeMemory(input: MemoryInput): Memory {
  const createdAt = input.createdAt ?? now();
  const requestedSummary = input.summary?.trim();
  const summary = requestedSummary && requestedSummary.length <= 240 ? requestedSummary : deterministicSummary(input.content);
  const title = input.title?.trim() || summary.split(/[.!?]/u)[0].slice(0, 100).trim() || "Untitled memory";
  const metadata = { ...(input.metadata ?? {}), keywords: deriveKeywords(input.content) };
  return {
    id: input.id?.trim() || createId(),
    type: input.type,
    projectId: input.projectId.trim() || "global",
    title,
    summary,
    content: input.content.trim(),
    tags: normalizeTags([...(input.tags ?? []), ...deriveKeywords(input.content).slice(0, 5)]),
    importance: normalizeImportance(input.importance),
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
    lastAccessed: input.lastAccessed ?? createdAt,
    accessCount: Math.max(0, Math.floor(input.accessCount ?? 0)),
    source: input.source.trim() || "unknown",
    metadata,
  };
}
function readClientStore(): Map<string, Memory> {
  if (!isClient()) return serverStore;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Map();
    return new Map(parsed.flatMap((item): [string, Memory][] => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Partial<Memory>;
      if (typeof candidate.id !== "string" || typeof candidate.projectId !== "string" || typeof candidate.content !== "string") return [];
      return [[candidate.id, normalizeMemory(candidate as MemoryInput)]];
    }));
  } catch { return new Map(); }
}
function writeClientStore(store: Map<string, Memory>): void {
  if (!isClient()) return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...store.values()])); } catch { /* memory remains usable for this session */ }
}
function limitValue(limit: number | undefined): number {
  return limit === undefined ? DEFAULT_LIMIT : Math.min(MAX_LIMIT, Math.max(0, Math.floor(limit)));
}

export class LocalMemoryBackend implements MemoryBackend {
  async list(): Promise<Memory[]> { return [...readClientStore().values()].map(clone); }
  async get(id: string): Promise<Memory | null> {
    const store = readClientStore();
    const memory = store.get(id);
    if (!memory) return null;
    const accessed = { ...memory, lastAccessed: now(), accessCount: memory.accessCount + 1 };
    store.set(id, accessed);
    if (!isClient()) serverStore.set(id, accessed);
    writeClientStore(store);
    return clone(accessed);
  }
  async save(memory: Memory): Promise<Memory> {
    const store = readClientStore();
    store.set(memory.id, clone(memory));
    if (!isClient()) serverStore.set(memory.id, clone(memory));
    writeClientStore(store);
    return clone(memory);
  }
  async update(id: string, patch: MemoryUpdate): Promise<Memory | null> {
    const store = readClientStore();
    const existing = store.get(id);
    if (!existing) return null;
    const updated = normalizeMemory({ ...existing, ...patch, id: existing.id, createdAt: existing.createdAt, updatedAt: now(), lastAccessed: existing.lastAccessed, accessCount: existing.accessCount });
    store.set(id, updated);
    if (!isClient()) serverStore.set(id, updated);
    writeClientStore(store);
    return clone(updated);
  }
  async delete(id: string): Promise<boolean> {
    const store = readClientStore();
    const deleted = store.delete(id);
    if (!isClient()) serverStore.delete(id);
    if (deleted) writeClientStore(store);
    return deleted;
  }
  async clear(): Promise<void> {
    if (isClient()) window.localStorage.removeItem(STORAGE_KEY);
    else serverStore.clear();
  }
  async importMemories(memories: readonly Memory[]): Promise<number> {
    const store = readClientStore();
    for (const memory of memories) store.set(memory.id, normalizeMemory(memory));
    if (!isClient()) { serverStore.clear(); for (const memory of store.values()) serverStore.set(memory.id, clone(memory)); }
    writeClientStore(store);
    return memories.length;
  }
}

let backend: MemoryBackend = new LocalMemoryBackend();
export function configureMemoryBackend(nextBackend: MemoryBackend): void { backend = nextBackend; }

export async function saveMemory(input: MemoryInput): Promise<Memory> {
  const memory = await backend.save(normalizeMemory(input));
  try {
    const { memoryGraphIntegration } = await import("../graph/memory-integration");
    await memoryGraphIntegration.onMemorySaved(memory);
  } catch (e) {
    console.error("Failed to integrate memory with graph", e);
  }
  return memory;
}
export async function getMemory(id: string): Promise<Memory | null> { return backend.get(id); }
export async function updateMemory(id: string, patch: MemoryUpdate): Promise<Memory | null> {
  return backend.update(id, patch);
}
export async function deleteMemory(id: string): Promise<boolean> { return backend.delete(id); }
export async function listMemories(options: MemoryListOptions = {}): Promise<Memory[]> {
  const records = await backend.list();
  return records.filter((memory) => (!options.projectId || memory.projectId === options.projectId) && (!options.types?.length || options.types.includes(memory.type))).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limitValue(options.limit));
}
export async function clearMemory(): Promise<void> { await backend.clear(); }
export async function exportMemory(): Promise<string> { return JSON.stringify({ version: 1, exportedAt: now(), memories: await backend.list() }, null, 2); }
export async function importMemory(payload: string | readonly Memory[]): Promise<number> {
  const parsed: unknown = typeof payload === "string" ? JSON.parse(payload) : payload;
  const memories = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === "object" && "memories" in parsed && Array.isArray(parsed.memories) ? parsed.memories : []);
  const valid = memories.filter((item): item is Memory => Boolean(item && typeof item === "object" && "id" in item && "content" in item && "projectId" in item));
  return backend.importMemories(valid);
}

function overlap(query: Set<string>, value: string): number {
  if (query.size === 0) return 0;
  const tokens = tokenize(value);
  let matches = 0;
  for (const token of query) if (tokens.has(token)) matches++;
  return matches / query.size;
}
function recency(value: string): number {
  const age = Math.max(0, Date.now() - new Date(value).getTime());
  return Number.isFinite(age) ? Math.exp((-Math.LN2 * age) / RECENCY_HALF_LIFE_MS) : 0;
}
function typeMatches(memory: Memory, options: MemorySearchOptions): boolean {
  return (!options.projectId || memory.projectId === options.projectId) && (!options.types?.length || options.types.includes(memory.type)) && (!options.tags?.length || options.tags.every((tag) => memory.tags.includes(tag.toLowerCase())));
}
export async function searchMemories(query: string, options: RelevantMemoryOptions = {}): Promise<MemorySearchResult[]> {
  const records = await backend.list();
  const queryTokens = tokenize(query);
  const maxAccess = Math.max(1, ...records.map((memory) => memory.accessCount));
  const ranked = records.filter((memory) => typeMatches(memory, options)).map((memory) => {
    const titleSimilarity = overlap(queryTokens, memory.title);
    const keywordSimilarity = overlap(queryTokens, String(memory.metadata.keywords ?? ""));
    const tagSimilarity = overlap(queryTokens, memory.tags.join(" "));
    const contentSimilarity = overlap(queryTokens, `${memory.summary} ${memory.content}`);
    const projectMatch = options.projectId && memory.projectId === options.projectId ? 1 : 0;
    const breakdown = { importance: memory.importance, recency: recency(memory.updatedAt), accessFrequency: Math.min(memory.accessCount / maxAccess, 1), projectMatch, titleSimilarity, keywordSimilarity, tagSimilarity, contentSimilarity };
    const score = breakdown.importance * 0.18 + breakdown.recency * 0.12 + breakdown.accessFrequency * 0.08 + breakdown.projectMatch * 0.16 + breakdown.titleSimilarity * 0.16 + breakdown.keywordSimilarity * 0.10 + breakdown.tagSimilarity * 0.08 + breakdown.contentSimilarity * 0.12;
    const reasons = [titleSimilarity > 0 && "title", tagSimilarity > 0 && "tags", keywordSimilarity > 0 && "keywords", contentSimilarity > 0 && "content", projectMatch > 0 && "current project", memory.importance >= 0.75 && "importance", breakdown.recency >= 0.75 && "recency"].filter((reason): reason is string => Boolean(reason));
    return { memory, score, confidence: Math.min(1, score + (queryTokens.size === 0 ? 0.2 : 0)), reasonMatched: reasons.length ? `Matched by ${reasons.join(", ")}.` : "Matched by stored memory signals.", breakdown };
  }).filter((result) => result.score >= (options.minScore ?? 0)).sort((a, b) => b.score - a.score || b.memory.updatedAt.localeCompare(a.memory.updatedAt)).slice(0, limitValue(options.limit));
  return Promise.all(ranked.map(async (result) => {
    const accessed = await backend.get(result.memory.id);
    return accessed ? { ...result, memory: accessed } : result;
  }));
}
export async function searchMemory(query: string, options: MemorySearchOptions = {}): Promise<Memory[]> {
  const results = await searchMemories(query, options);
  return results.filter((result) => !query.trim() || result.score > 0).map((result) => result.memory);
}
export async function getRelevantMemories(query: string, options: RelevantMemoryOptions = {}): Promise<Array<Memory & { score: number }>> {
  return (await searchMemories(query, options)).map((result) => ({ ...result.memory, score: result.score }));
}

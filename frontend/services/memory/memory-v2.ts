/**
 * Memory Engine V2
 *
 * A normalized, provider-independent memory boundary. The engine deliberately
 * knows nothing about AI providers, embeddings, or a particular persistence
 * vendor. A backend can be swapped through MemoryBackend without changing the
 * public CRUD and retrieval API.
 */

export const MEMORY_TYPES = [
  "founder",
  "company",
  "project",
  "document",
  "chat",
  "goal",
  "task",
  "deadline",
  "business-decision",
  "investor-note",
  "competitor",
  "product-feature",
  "research",
] as const;

export type MemoryType = (typeof MEMORY_TYPES)[number];

export interface Memory {
  id: string;
  type: MemoryType;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  /** Importance is normalized to the inclusive range 0..1. */
  importance: number;
  tags: readonly string[];
  summary: string;
  source: string;
  content: string;
}

export type MemoryInput = Omit<Memory, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MemoryUpdate = Partial<
  Pick<Memory, "type" | "projectId" | "importance" | "tags" | "summary" | "source" | "content">
>;

export interface MemorySearchOptions {
  projectId?: string;
  types?: readonly MemoryType[];
  tags?: readonly string[];
  limit?: number;
}

export interface RelevantMemoryOptions extends MemorySearchOptions {
  minScore?: number;
}

export interface RelevantMemory extends Memory {
  score: number;
}

export interface MemoryBackend {
  list(): Promise<Memory[]>;
  save(memory: Memory): Promise<Memory>;
  update(id: string, patch: MemoryUpdate): Promise<Memory | null>;
  delete(id: string): Promise<boolean>;
}

const STORAGE_KEY = "foundergpt_memory_v2";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;
const RECENCY_HALF_LIFE_MS = 30 * 24 * 60 * 60 * 1000;

const serverStore = new Map<string, Memory>();

function clone<T>(value: T): T {
  return structuredClone(value);
}

function isClient(): boolean {
  return typeof window !== "undefined";
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `memory_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function now(): string {
  return new Date().toISOString();
}

function normalizeTags(tags: readonly string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

function normalizeImportance(importance: number): number {
  if (!Number.isFinite(importance)) return 0;
  return Math.min(1, Math.max(0, importance));
}

function normalizeMemory(input: MemoryInput): Memory {
  const timestamp = input.createdAt ?? now();
  return {
    id: input.id?.trim() || createId(),
    type: input.type,
    projectId: input.projectId.trim(),
    createdAt: timestamp,
    updatedAt: input.updatedAt ?? timestamp,
    importance: normalizeImportance(input.importance),
    tags: normalizeTags(input.tags),
    summary: input.summary.trim(),
    source: input.source.trim(),
    content: input.content,
  };
}

function readClientStore(): Map<string, Memory> {
  if (!isClient()) return serverStore;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const records = JSON.parse(raw) as Memory[];
    return new Map(records.map((memory) => [memory.id, memory]));
  } catch {
    return new Map();
  }
}

function writeClientStore(store: Map<string, Memory>): void {
  if (!isClient()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...store.values()]));
  } catch {
    // Keep the operation successful in memory if browser storage is unavailable.
  }
}

/** Default backend: localStorage in the browser and an SSR-safe process map. */
export class LocalMemoryBackend implements MemoryBackend {
  async list(): Promise<Memory[]> {
    return [...readClientStore().values()].map(clone);
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

    const updated: Memory = {
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: now(),
      projectId: patch.projectId?.trim() || existing.projectId,
      summary: patch.summary?.trim() ?? existing.summary,
      source: patch.source?.trim() ?? existing.source,
      tags: patch.tags ? normalizeTags(patch.tags) : existing.tags,
      importance: patch.importance === undefined
        ? existing.importance
        : normalizeImportance(patch.importance),
    };
    store.set(id, clone(updated));
    if (!isClient()) serverStore.set(id, clone(updated));
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
}

let backend: MemoryBackend = new LocalMemoryBackend();

/** Replace the persistence backend without changing the memory API. */
export function configureMemoryBackend(nextBackend: MemoryBackend): void {
  backend = nextBackend;
}

export async function saveMemory(input: MemoryInput): Promise<Memory> {
  const memory = normalizeMemory(input);
  if (!memory.projectId) throw new Error("Memory projectId is required.");
  if (!memory.summary) throw new Error("Memory summary is required.");
  if (!memory.source) throw new Error("Memory source is required.");
  return backend.save(memory);
}

export function updateMemory(id: string, patch: MemoryUpdate): Promise<Memory | null> {
  return backend.update(id, patch);
}

export function deleteMemory(id: string): Promise<boolean> {
  return backend.delete(id);
}

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2),
  );
}

function textScore(query: string, memory: Memory): number {
  const queryTokens = tokenize(query);
  if (queryTokens.size === 0) return 0.5;

  const searchableText = [
    memory.type,
    memory.summary,
    memory.source,
    memory.content,
    ...memory.tags,
  ].join(" ");
  const searchableTokens = tokenize(searchableText);
  let matches = 0;
  for (const token of queryTokens) {
    if (searchableTokens.has(token)) matches++;
  }
  return matches / queryTokens.size;
}

function recencyScore(updatedAt: string): number {
  const age = Math.max(0, Date.now() - new Date(updatedAt).getTime());
  return Number.isFinite(age)
    ? Math.exp((-Math.LN2 * age) / RECENCY_HALF_LIFE_MS)
    : 0;
}

function matchesOptions(memory: Memory, options: MemorySearchOptions): boolean {
  if (options.projectId && memory.projectId !== options.projectId) return false;
  if (options.types?.length && !options.types.includes(memory.type)) return false;
  if (options.tags?.length) {
    const memoryTags = new Set(memory.tags);
    if (!options.tags.every((tag) => memoryTags.has(tag.toLowerCase()))) return false;
  }
  return true;
}

async function rankedMemories(
  query: string,
  options: RelevantMemoryOptions = {},
): Promise<RelevantMemory[]> {
  const records = await backend.list();
  const minScore = options.minScore ?? 0;
  return records
    .filter((memory) => matchesOptions(memory, options))
    .map((memory) => {
      const lexical = textScore(query, memory);
      const score = lexical * 0.55 + memory.importance * 0.25 + recencyScore(memory.updatedAt) * 0.2;
      return { ...clone(memory), score };
    })
    .filter((memory) => memory.score >= minScore)
    .sort((a, b) => b.score - a.score || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, normalizeLimit(options.limit));
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(0, Math.floor(limit)));
}

export async function searchMemory(
  query: string,
  options: MemorySearchOptions = {},
): Promise<Memory[]> {
  const ranked = await rankedMemories(query, { ...options, minScore: 0 });
  const matches = query.trim()
    ? ranked.filter((memory) => textScore(query, memory) > 0)
    : ranked;
  return matches.map(({ score: _score, ...memory }) => memory);
}

export function getRelevantMemories(
  query: string,
  options: RelevantMemoryOptions = {},
): Promise<RelevantMemory[]> {
  return rankedMemories(query, options);
}

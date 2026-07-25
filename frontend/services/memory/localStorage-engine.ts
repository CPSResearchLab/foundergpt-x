/**
 * LocalStorageMemoryEngine
 *
 * Implements MemoryEngine using localStorage on the client and an in-process
 * Map on the server (SSR / API routes have no DOM).
 *
 * Swap guide — to replace with DynamoDB:
 *   1. Create `DynamoMemoryEngine implements MemoryEngine` in a new file.
 *   2. In `persistence.ts`, change `createEngine()` to return it.
 *   3. Delete this file. No other file changes required.
 *
 * Storage layout:
 *   localStorage key: "foundergpt_mem_<collection>"
 *   value: JSON array of MemoryRecord objects
 */

import type { MemoryEngine, MemoryCollection, MemoryUpdate, MemorySearchOptions } from "./memory";
import type { MemoryRecord } from "./types";

// ─── SSR fallback ─────────────────────────────────────────────────────────────

const serverStore = new Map<MemoryCollection, Map<string, MemoryRecord>>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isClient = (): boolean => typeof window !== "undefined";

const storageKey = (collection: MemoryCollection): string =>
  `foundergpt_mem_${collection}`;

function readCollection<T extends MemoryRecord>(collection: MemoryCollection): Map<string, T> {
  if (!isClient()) {
    const existing = serverStore.get(collection) as Map<string, T> | undefined;
    if (existing) return existing;
    const fresh = new Map<string, T>();
    serverStore.set(collection, fresh as Map<string, MemoryRecord>);
    return fresh;
  }

  try {
    const raw = localStorage.getItem(storageKey(collection));
    if (!raw) return new Map();
    const arr = JSON.parse(raw) as T[];
    return new Map(arr.map((r) => [r.id, r]));
  } catch {
    return new Map();
  }
}

function writeCollection<T extends MemoryRecord>(
  collection: MemoryCollection,
  map: Map<string, T>,
): void {
  if (!isClient()) return; // server store is mutated in-place via readCollection reference

  try {
    localStorage.setItem(storageKey(collection), JSON.stringify(Array.from(map.values())));
  } catch {
    // Quota exceeded — silently skip; data will be in-memory for this session
  }
}

const clone = <T>(value: T): T => structuredClone(value);

// ─── Engine ───────────────────────────────────────────────────────────────────

export class LocalStorageMemoryEngine implements MemoryEngine {
  async saveMemory<T extends MemoryRecord>(collection: MemoryCollection, memory: T): Promise<T> {
    const map = readCollection<T>(collection);
    const record = clone(memory);
    map.set(record.id, record);
    writeCollection(collection, map);
    return clone(record);
  }

  async getMemory<T extends MemoryRecord>(
    collection: MemoryCollection,
    id: string,
  ): Promise<T | null> {
    const record = readCollection<T>(collection).get(id);
    return record ? clone(record) : null;
  }

  async updateMemory<T extends MemoryRecord>(
    collection: MemoryCollection,
    id: string,
    update: MemoryUpdate<T>,
  ): Promise<T | null> {
    const map = readCollection<T>(collection);
    const existing = map.get(id);
    if (!existing) return null;

    const updated: T = {
      ...existing,
      ...update,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    map.set(id, clone(updated));
    writeCollection(collection, map);
    return clone(updated);
  }

  async deleteMemory(collection: MemoryCollection, id: string): Promise<boolean> {
    const map = readCollection(collection);
    const deleted = map.delete(id);
    if (deleted) writeCollection(collection, map);
    return deleted;
  }

  async searchMemory<T extends MemoryRecord>(
    collection: MemoryCollection,
    options: MemorySearchOptions<T> = {},
  ): Promise<T[]> {
    const { text, limit = Number.POSITIVE_INFINITY, predicate } = options;
    const normalised = text?.trim().toLowerCase();
    const results: T[] = [];

    for (const record of readCollection<T>(collection).values()) {
      const textMatch =
        !normalised || JSON.stringify(record).toLowerCase().includes(normalised);
      if (textMatch && (!predicate || predicate(record))) {
        results.push(clone(record));
        if (results.length >= limit) break;
      }
    }

    return results;
  }
}

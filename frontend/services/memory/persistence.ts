/**
 * persistence.ts
 *
 * The single source of truth for which storage engine is active.
 *
 * Current engine: LocalStorageMemoryEngine
 *   - Client: localStorage, keyed per collection
 *   - Server: in-process Map (SSR / API routes)
 *
 * To swap to DynamoDB:
 *   Replace `new LocalStorageMemoryEngine()` with `new DynamoMemoryEngine()`
 *   in `createEngine()` below. Nothing else changes.
 */

import type { MemoryRecord } from "./types";
import type { MemoryEngine, MemoryCollection, MemoryUpdate, MemorySearchOptions } from "./memory";
import { LocalStorageMemoryEngine } from "./localStorage-engine";

// ─── Engine factory ───────────────────────────────────────────────────────────
// Replace this function body to switch backends.

function createEngine(): MemoryEngine {
  return new LocalStorageMemoryEngine();
}

const engine: MemoryEngine = createEngine();

// ─── Public CRUD API ──────────────────────────────────────────────────────────
// All functions are async. Callers never import the engine directly.

export async function saveMemory<T extends MemoryRecord>(
  collection: MemoryCollection,
  record: T,
): Promise<T> {
  return engine.saveMemory(collection, record);
}

export async function getMemory<T extends MemoryRecord>(
  collection: MemoryCollection,
  id: string,
): Promise<T | null> {
  return engine.getMemory<T>(collection, id);
}

export async function updateMemory<T extends MemoryRecord>(
  collection: MemoryCollection,
  id: string,
  update: MemoryUpdate<T>,
): Promise<T | null> {
  return engine.updateMemory<T>(collection, id, update);
}

export async function deleteMemory(
  collection: MemoryCollection,
  id: string,
): Promise<boolean> {
  return engine.deleteMemory(collection, id);
}

export async function searchMemory<T extends MemoryRecord>(
  collection: MemoryCollection,
  options?: MemorySearchOptions<T>,
): Promise<T[]> {
  return engine.searchMemory<T>(collection, options);
}

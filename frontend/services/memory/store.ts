/**
 * Memory Store
 *
 * Persists MessageMemoryRecords.
 * - Client-side: localStorage (survives page refresh, scoped per browser)
 * - Server-side: in-process Map (scoped to the Node.js process lifetime)
 *
 * Both paths expose the same interface so callers are environment-agnostic.
 */

import type { MessageMemoryRecord } from "./types";

const STORAGE_KEY = "foundergpt_message_memory";

// ─── Server-side store (in-process Map) ──────────────────────────────────────

const serverStore = new Map<string, MessageMemoryRecord>();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isClient(): boolean {
  return typeof window !== "undefined";
}

function readFromLocalStorage(): MessageMemoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MessageMemoryRecord[]) : [];
  } catch {
    return [];
  }
}

function writeToLocalStorage(records: MessageMemoryRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Storage quota exceeded — silently skip
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Persist a single message record. Idempotent — overwrites by id. */
export function storeMessageRecord(record: MessageMemoryRecord): void {
  if (isClient()) {
    const existing = readFromLocalStorage();
    const idx = existing.findIndex((r) => r.id === record.id);
    if (idx >= 0) {
      existing[idx] = record;
    } else {
      existing.push(record);
    }
    writeToLocalStorage(existing);
  } else {
    serverStore.set(record.id, record);
  }
}

/** Retrieve all records for a given project, sorted newest-first. */
export function getProjectRecords(projectId: string): MessageMemoryRecord[] {
  const all = isClient() ? readFromLocalStorage() : Array.from(serverStore.values());
  return all
    .filter((r) => r.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Retrieve all records for a given session, sorted oldest-first (chronological). */
export function getSessionRecords(sessionId: string): MessageMemoryRecord[] {
  const all = isClient() ? readFromLocalStorage() : Array.from(serverStore.values());
  return all
    .filter((r) => r.sessionId === sessionId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/** Return the total count of stored records (used by the dashboard metric). */
export function getStoredMessageCount(): number {
  if (isClient()) return readFromLocalStorage().length;
  return serverStore.size;
}

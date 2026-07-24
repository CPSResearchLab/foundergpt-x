import { memoryEngine } from "./memory";
import type { MemoryCollection, MemorySearchOptions, MemoryUpdate } from "./memory";
import type { MemoryRecord } from "./types";

export class MemoryStore {
  constructor(private readonly collection: MemoryCollection) {}

  saveMemory<T extends MemoryRecord>(memory: T): Promise<T> {
    return memoryEngine.saveMemory(this.collection, memory);
  }

  searchMemory<T extends MemoryRecord>(options?: MemorySearchOptions<T>): Promise<T[]> {
    return memoryEngine.searchMemory(this.collection, options);
  }

  deleteMemory(id: string): Promise<boolean> {
    return memoryEngine.deleteMemory(this.collection, id);
  }

  updateMemory<T extends MemoryRecord>(id: string, update: MemoryUpdate<T>): Promise<T | null> {
    return memoryEngine.updateMemory(this.collection, id, update);
  }
}

export function createMemoryStore(collection: MemoryCollection): MemoryStore {
  return new MemoryStore(collection);
}

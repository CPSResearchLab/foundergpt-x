import type { MemoryRecord } from "./types";

export type MemoryCollection = string;

export type MemoryUpdate<T extends MemoryRecord> = Partial<
  Omit<T, "id" | "createdAt" | "updatedAt">
>;

export interface MemorySearchOptions<T extends MemoryRecord> {
  text?: string;
  limit?: number;
  predicate?: (memory: T) => boolean;
}

export interface MemoryEngine {
  saveMemory<T extends MemoryRecord>(collection: MemoryCollection, memory: T): Promise<T>;
  getMemory<T extends MemoryRecord>(collection: MemoryCollection, id: string): Promise<T | null>;
  updateMemory<T extends MemoryRecord>(
    collection: MemoryCollection,
    id: string,
    update: MemoryUpdate<T>,
  ): Promise<T | null>;
  deleteMemory(collection: MemoryCollection, id: string): Promise<boolean>;
  searchMemory<T extends MemoryRecord>(
    collection: MemoryCollection,
    options?: MemorySearchOptions<T>,
  ): Promise<T[]>;
}

const cloneMemory = <T extends MemoryRecord>(memory: T): T => structuredClone(memory);

export class InMemoryMemoryEngine implements MemoryEngine {
  private readonly collections = new Map<MemoryCollection, Map<string, MemoryRecord>>();

  async saveMemory<T extends MemoryRecord>(collection: MemoryCollection, memory: T): Promise<T> {
    const records = this.getCollection(collection);
    const savedMemory = cloneMemory(memory);
    records.set(savedMemory.id, savedMemory);
    return cloneMemory(savedMemory);
  }

  async getMemory<T extends MemoryRecord>(collection: MemoryCollection, id: string): Promise<T | null> {
    const memory = this.getCollection(collection).get(id) as T | undefined;
    return memory ? cloneMemory(memory) : null;
  }

  async updateMemory<T extends MemoryRecord>(
    collection: MemoryCollection,
    id: string,
    update: MemoryUpdate<T>,
  ): Promise<T | null> {
    const records = this.getCollection(collection);
    const existingMemory = records.get(id) as T | undefined;

    if (!existingMemory) {
      return null;
    }

    const updatedMemory: T = {
      ...existingMemory,
      ...update,
      id: existingMemory.id,
      createdAt: existingMemory.createdAt,
      updatedAt: new Date().toISOString(),
    };
    records.set(id, cloneMemory(updatedMemory));
    return cloneMemory(updatedMemory);
  }

  async deleteMemory(collection: MemoryCollection, id: string): Promise<boolean> {
    return this.getCollection(collection).delete(id);
  }

  async searchMemory<T extends MemoryRecord>(
    collection: MemoryCollection,
    options: MemorySearchOptions<T> = {},
  ): Promise<T[]> {
    const normalizedText = options.text?.trim().toLocaleLowerCase();
    const limit = options.limit === undefined ? Number.POSITIVE_INFINITY : Math.max(0, options.limit);
    const matches: T[] = [];

    for (const memory of this.getCollection(collection).values() as IterableIterator<T>) {
      const matchesText = !normalizedText || JSON.stringify(memory).toLocaleLowerCase().includes(normalizedText);
      if (matchesText && (!options.predicate || options.predicate(memory))) {
        matches.push(cloneMemory(memory));
      }
      if (matches.length >= limit) {
        break;
      }
    }

    return matches;
  }

  private getCollection(collection: MemoryCollection): Map<string, MemoryRecord> {
    const existingCollection = this.collections.get(collection);
    if (existingCollection) {
      return existingCollection;
    }

    const newCollection = new Map<string, MemoryRecord>();
    this.collections.set(collection, newCollection);
    return newCollection;
  }
}

export const memoryEngine: MemoryEngine = new InMemoryMemoryEngine();

export const saveMemory = <T extends MemoryRecord>(collection: MemoryCollection, memory: T): Promise<T> =>
  memoryEngine.saveMemory(collection, memory);

export const getMemory = <T extends MemoryRecord>(collection: MemoryCollection, id: string): Promise<T | null> =>
  memoryEngine.getMemory(collection, id);

export const updateMemory = <T extends MemoryRecord>(
  collection: MemoryCollection,
  id: string,
  update: MemoryUpdate<T>,
): Promise<T | null> => memoryEngine.updateMemory(collection, id, update);

export const deleteMemory = (collection: MemoryCollection, id: string): Promise<boolean> =>
  memoryEngine.deleteMemory(collection, id);

export const searchMemory = <T extends MemoryRecord>(
  collection: MemoryCollection,
  options?: MemorySearchOptions<T>,
): Promise<T[]> => memoryEngine.searchMemory(collection, options);

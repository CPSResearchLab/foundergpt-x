import { ContextBuilder, type MemoryContextInput, type MemoryContextObject } from "./context-engine";
import { deleteMemory, getMemory, listMemories, saveMemory, searchMemories, updateMemory, type Memory, type MemoryInput, type MemorySearchOptions, type MemorySearchResult, type MemoryUpdate } from "./memory-v2";

export class MemoryManager {
  private readonly contextBuilder: ContextBuilder;

  constructor(contextBuilder = new ContextBuilder()) { this.contextBuilder = contextBuilder; }

  save(input: MemoryInput): Promise<Memory> { return saveMemory(input); }
  get(id: string): Promise<Memory | null> { return getMemory(id); }
  update(id: string, patch: MemoryUpdate): Promise<Memory | null> { return updateMemory(id, patch); }
  delete(id: string): Promise<boolean> { return deleteMemory(id); }
  list(options?: MemorySearchOptions): Promise<Memory[]> { return listMemories(options); }
  search(query: string, options?: MemorySearchOptions): Promise<MemorySearchResult[]> { return searchMemories(query, options); }

  async deduplicate(options: MemorySearchOptions = {}): Promise<number> {
    const memories = await listMemories({ ...options, limit: 500 });
    const seen = new Set<string>();
    let removed = 0;
    for (const memory of memories) {
      const key = `${memory.projectId}|${memory.type}|${memory.content.toLocaleLowerCase().replace(/\s+/g, " ").trim()}`;
      if (seen.has(key)) { if (await deleteMemory(memory.id)) removed++; } else seen.add(key);
    }
    return removed;
  }

  async cleanup(options: { olderThan?: string; minimumImportance?: number } = {}): Promise<number> {
    const memories = await listMemories({ limit: 500 });
    let removed = 0;
    for (const memory of memories) {
      const old = options.olderThan ? memory.updatedAt < options.olderThan : false;
      const unimportant = options.minimumImportance !== undefined && memory.importance < options.minimumImportance;
      if (old && unimportant && await deleteMemory(memory.id)) removed++;
    }
    return removed;
  }

  buildContext(input: MemoryContextInput): Promise<MemoryContextObject & { relevantMemories: readonly MemorySearchResult[] }> {
    return this.contextBuilder.build(input);
  }
}

export const memoryManager = new MemoryManager();

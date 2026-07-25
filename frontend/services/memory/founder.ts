import { saveMemory, getMemory, updateMemory, deleteMemory, searchMemory, type MemoryUpdate } from "./memory";
import type { FounderMemory } from "./types";

const COLLECTION = "founders";

export const saveFounderMemory = (founder: FounderMemory): Promise<FounderMemory> =>
  saveMemory(COLLECTION, founder);

export const getFounderMemory = (id: string): Promise<FounderMemory | null> =>
  getMemory<FounderMemory>(COLLECTION, id);

export const updateFounderMemory = (id: string, update: MemoryUpdate<FounderMemory>): Promise<FounderMemory | null> =>
  updateMemory<FounderMemory>(COLLECTION, id, update);

export const deleteFounderMemory = (id: string): Promise<boolean> =>
  deleteMemory(COLLECTION, id);

export const searchFounderMemory = (query: string, projectId?: string): Promise<FounderMemory[]> =>
  searchMemory<FounderMemory>(COLLECTION, {
    text: query,
    predicate: (f) => !projectId || f.projectId === projectId,
  });

import { saveMemory, getMemory, updateMemory, deleteMemory, searchMemory, type MemoryUpdate } from "./memory";
import type { ResearchMemory } from "./types";

const COLLECTION = "research";

export const saveResearchMemory = (research: ResearchMemory): Promise<ResearchMemory> =>
  saveMemory(COLLECTION, research);

export const getResearchMemory = (id: string): Promise<ResearchMemory | null> =>
  getMemory<ResearchMemory>(COLLECTION, id);

export const updateResearchMemory = (id: string, update: MemoryUpdate<ResearchMemory>): Promise<ResearchMemory | null> =>
  updateMemory<ResearchMemory>(COLLECTION, id, update);

export const deleteResearchMemory = (id: string): Promise<boolean> =>
  deleteMemory(COLLECTION, id);

export const searchResearchMemory = (query: string, projectId?: string): Promise<ResearchMemory[]> =>
  searchMemory<ResearchMemory>(COLLECTION, {
    text: query,
    predicate: (r) => !projectId || r.projectId === projectId,
  });

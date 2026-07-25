import { saveMemory, getMemory, updateMemory, deleteMemory, searchMemory, type MemoryUpdate } from "./memory";
import type { DecisionMemory } from "./types";

const COLLECTION = "decisions";

export const saveDecisionMemory = (decision: DecisionMemory): Promise<DecisionMemory> =>
  saveMemory(COLLECTION, decision);

export const getDecisionMemory = (id: string): Promise<DecisionMemory | null> =>
  getMemory<DecisionMemory>(COLLECTION, id);

export const updateDecisionMemory = (id: string, update: MemoryUpdate<DecisionMemory>): Promise<DecisionMemory | null> =>
  updateMemory<DecisionMemory>(COLLECTION, id, update);

export const deleteDecisionMemory = (id: string): Promise<boolean> =>
  deleteMemory(COLLECTION, id);

export const searchDecisionMemory = (query: string, projectId?: string): Promise<DecisionMemory[]> =>
  searchMemory<DecisionMemory>(COLLECTION, {
    text: query,
    predicate: (d) => !projectId || d.projectId === projectId,
  });

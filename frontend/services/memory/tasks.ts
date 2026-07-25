import { saveMemory, getMemory, updateMemory, deleteMemory, searchMemory, type MemoryUpdate } from "./memory";
import type { TaskMemory } from "./types";

const COLLECTION = "tasks";

export const saveTaskMemory = (task: TaskMemory): Promise<TaskMemory> =>
  saveMemory(COLLECTION, task);

export const getTaskMemory = (id: string): Promise<TaskMemory | null> =>
  getMemory<TaskMemory>(COLLECTION, id);

export const updateTaskMemory = (id: string, update: MemoryUpdate<TaskMemory>): Promise<TaskMemory | null> =>
  updateMemory<TaskMemory>(COLLECTION, id, update);

export const deleteTaskMemory = (id: string): Promise<boolean> =>
  deleteMemory(COLLECTION, id);

export const searchTaskMemory = (query: string, projectId?: string): Promise<TaskMemory[]> =>
  searchMemory<TaskMemory>(COLLECTION, {
    text: query,
    predicate: (t) => !projectId || t.projectId === projectId,
  });

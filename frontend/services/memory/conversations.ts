import { saveMemory, getMemory, updateMemory, deleteMemory, searchMemory, type MemoryUpdate } from "./memory";
import type { ConversationMemory } from "./types";

const COLLECTION = "conversations";

export const saveConversationMemory = (conversation: ConversationMemory): Promise<ConversationMemory> =>
  saveMemory(COLLECTION, conversation);

export const getConversationMemory = (id: string): Promise<ConversationMemory | null> =>
  getMemory<ConversationMemory>(COLLECTION, id);

export const updateConversationMemory = (
  id: string,
  update: MemoryUpdate<ConversationMemory>,
): Promise<ConversationMemory | null> =>
  updateMemory<ConversationMemory>(COLLECTION, id, update);

export const deleteConversationMemory = (id: string): Promise<boolean> =>
  deleteMemory(COLLECTION, id);

export const searchConversationMemory = (
  query: string,
  projectId?: string,
): Promise<ConversationMemory[]> =>
  searchMemory<ConversationMemory>(COLLECTION, {
    text: query,
    predicate: (c) => !projectId || c.projectId === projectId,
  });

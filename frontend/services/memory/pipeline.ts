/**
 * Memory Pipeline
 *
 * The single write path for all AI messages.
 * Called after every user message and every assistant response.
 *
 * Responsibilities:
 *   1. Build a fully-attributed MessageMemoryRecord
 *   2. Extract entities from the content
 *   3. Derive tags
 *   4. Persist to the memory store
 */

import type { ChatMessageEntry, MessageMemoryRecord } from "./types";
import { storeMessageRecord } from "./store";
import { extractEntities, deriveTags } from "./extractor";
import { createMemoryStore } from "./memory-store";

const chatMemoryStore = createMemoryStore("chat_messages");

export interface StoreChatMessageInput {
  /** Unique message id (reuse the id from ChatMessage if available). */
  id?: string;
  userId: string;
  projectId: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
}

/** Store a single chat message through the memory pipeline. */
export function storeChatMessage(input: StoreChatMessageInput): MessageMemoryRecord {
  const now = new Date().toISOString();
  const id = input.id ?? crypto.randomUUID();

  const entities = extractEntities(input.content);
  const tags = deriveTags(input.content, entities);

  const record: MessageMemoryRecord = {
    id,
    ownerId: input.userId,
    userId: input.userId,
    projectId: input.projectId,
    sessionId: input.sessionId,
    role: input.role,
    content: input.content,
    tags,
    entities,
    relevanceScore: 1,
    createdAt: now,
    updatedAt: now,
  };

  storeMessageRecord(record);

  const entry: ChatMessageEntry = {
    id,
    ownerId: input.userId,
    userId: input.userId,
    projectId: input.projectId,
    chatId: input.sessionId,
    role: input.role,
    message: input.content,
    timestamp: now,
    createdAt: now,
    updatedAt: now,
  };

  void chatMemoryStore.saveMemory(entry);

  return record;
}

// Memory module public API
// Import from "@/services/memory" instead of individual files.

export type {
  MessageMemoryRecord,
  ChatMessageEntry,
  RankedMemory,
  RetrievedMemoryContext,
  ExtractedEntities,
  MemorySearchResult,
  AgentMemoryContext,
  MemoryRecord,
  MemoryContext,
  UserMemory,
  ProjectMemory,
  ChatMemory,
  DocumentMemory,
  ConversationSummary,
  GoalMemory,
  TaskMemory,
  DocumentAuthor,
  DocumentType,
  StartupStage,
  MemoryTimestamp,
  MemoryValue,
  MemoryPrimitive,
  MemoryReference,
} from "./types";

export { buildMemoryContext } from "./context";
export type { BuildMemoryContextInput } from "./context";

export {
  memoryEngine,
  saveMemory,
  getMemory,
  updateMemory,
  deleteMemory,
  searchMemory,
  getMemoryEntryCount,
  InMemoryMemoryEngine,
} from "./memory";
export type { MemoryCollection, MemoryUpdate, MemorySearchOptions, MemoryEngine } from "./memory";

export { storeMessageRecord, getProjectRecords, getSessionRecords, getStoredMessageCount } from "./store";

export { extractEntities, deriveTags } from "./extractor";

export { retrieveRelevantMemory, getRecentSessionMessages, retrieveMemoryContext } from "./retrieval";
export type { RetrievalOptions, RetrieveMemoryContextOptions } from "./retrieval";

export { rankMemories } from "./ranking";
export type { RankOptions } from "./ranking";

export { storeChatMessage } from "./pipeline";
export type { StoreChatMessageInput } from "./pipeline";

export { buildAgentMemoryContext, serializeContextToSystemPrompt } from "./context-builder";
export type { BuildContextInput } from "./context-builder";

export { saveProjectMemory, getProjectMemory, updateProjectMemory, deleteProjectMemory, searchProjectMemory } from "./projects";

export { createDocumentMemory, getDocumentMemory, updateDocumentMemory, deleteDocumentMemory, searchDocumentMemory } from "./documents";
export type { CreateDocumentMemoryInput } from "./documents";

export { MemoryStore, createMemoryStore } from "./memory-store";

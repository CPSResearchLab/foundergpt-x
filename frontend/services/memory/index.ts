// Memory module public API
// Import from "@/services/memory" instead of individual files.

export type {
  MessageMemoryRecord,
  ChatMessageEntry,
  RankedMemory,
  RetrievedMemoryContext,
  ExtractedEntities,
  MemorySearchResult as LegacyMemorySearchResult,
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
  getMemory as legacyGetMemory,
  getMemoryEntryCount,
  InMemoryMemoryEngine,
} from "./memory";
export {
  saveMemory as legacySaveMemory,
  updateMemory as legacyUpdateMemory,
  deleteMemory as legacyDeleteMemory,
  searchMemory as legacySearchMemory,
} from "./memory";
export type {
  MemoryCollection,
  MemoryUpdate as LegacyMemoryUpdate,
  MemorySearchOptions as LegacyMemorySearchOptions,
  MemoryEngine,
} from "./memory";

export {
  configureMemoryBackend,
  saveMemory,
  getMemory,
  listMemories,
  updateMemory,
  deleteMemory,
  clearMemory,
  exportMemory,
  importMemory,
  searchMemory,
  searchMemories,
  getRelevantMemories,
  LocalMemoryBackend,
} from "./memory-v2";
export type {
  Memory,
  MemoryCategory,
  MemoryType,
  LegacyMemoryType,
  MemoryInput,
  MemoryUpdate,
  MemorySearchOptions,
  MemoryListOptions,
  MemorySearchResult,
  RelevantMemoryOptions,
  MemoryBackend,
} from "./memory-v2";
export { MEMORY_TYPES } from "./memory-v2";

export { MemoryManager, memoryManager } from "./memory-manager";
export { ContextBuilder, ContextAssembler, MemoryRetriever } from "./context-engine";
export type { MemoryContextInput, MemoryContextObject } from "./context-engine";

export { storeMessageRecord, getProjectRecords, getSessionRecords, getStoredMessageCount } from "./store";

export { extractEntities, deriveTags } from "./extractor";
export { extractKnowledge, storeExtractedKnowledge } from "./knowledge-extractor";
export type { ExtractedKnowledge, KnowledgeExtractionContext } from "./knowledge-extractor";

export { retrieveRelevantMemory, getRecentSessionMessages, retrieveMemoryContext } from "./retrieval";
export type { RetrievalOptions, RetrieveMemoryContextOptions } from "./retrieval";

export { rankMemories } from "./ranking";
export type { RankOptions } from "./ranking";

export { storeChatMessage } from "./pipeline";
export type { StoreChatMessageInput } from "./pipeline";

export { buildAgentMemoryContext, serializeContextToSystemPrompt } from "./context-builder";
export type { BuildContextInput } from "./context-builder";

export { buildFounderGPTContext, serializeFounderGPTContext } from "./foundergpt-context";
export type {
  FounderGPTContextInput,
  FounderGPTContext,
  ContextMemory,
  FounderProfile,
  CompanyProfile,
} from "./foundergpt-context";

export { saveProjectMemory, getProjectMemory, updateProjectMemory, deleteProjectMemory, searchProjectMemory } from "./projects";

export { createDocumentMemory, getDocumentMemory, updateDocumentMemory, deleteDocumentMemory, searchDocumentMemory } from "./documents";
export type { CreateDocumentMemoryInput } from "./documents";

export { MemoryStore, createMemoryStore } from "./memory-store";

export { LocalStorageMemoryEngine } from "./localStorage-engine";

export {
  saveMemory as persistSaveMemory,
  getMemory as persistGetMemory,
  updateMemory as persistUpdateMemory,
  deleteMemory as persistDeleteMemory,
  searchMemory as persistSearchMemory,
} from "./persistence";

export {
  saveConversationMemory,
  getConversationMemory,
  updateConversationMemory,
  deleteConversationMemory,
  searchConversationMemory,
} from "./conversations";

export { saveFounderMemory, getFounderMemory, updateFounderMemory, deleteFounderMemory, searchFounderMemory } from "./founder";
export { saveCompanyMemory, getCompanyMemory, updateCompanyMemory, deleteCompanyMemory, searchCompanyMemory } from "./company";
export { saveTaskMemory, getTaskMemory, updateTaskMemory, deleteTaskMemory, searchTaskMemory } from "./tasks";
export { saveResearchMemory, getResearchMemory, updateResearchMemory, deleteResearchMemory, searchResearchMemory } from "./research";
export { saveDecisionMemory, getDecisionMemory, updateDecisionMemory, deleteDecisionMemory, searchDecisionMemory } from "./decisions";
export { searchAllMemory } from "./search";
export type { UnifiedSearchResults, SearchOptions } from "./search";

export type {
  EngineMemoryBase,
  FounderMemory,
  CompanyMemory,
  ConversationMemory,
  ResearchMemory,
  DecisionMemory,
} from "./types";

export type { MemoryUpdate as PersistenceMemoryUpdate } from "./memory";

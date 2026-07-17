import type {
  ChatMemory,
  ConversationSummary,
  DocumentMemory,
  MemoryContext,
  ProjectMemory,
  UserMemory,
} from "./types";

export interface BuildMemoryContextInput {
  user: UserMemory;
  project: ProjectMemory;
  currentConversation: ChatMemory;
  recentChats?: readonly ChatMemory[];
  recentDocuments?: readonly DocumentMemory[];
  conversationSummary?: ConversationSummary;
}

export const buildMemoryContext = (input: BuildMemoryContextInput): MemoryContext => ({
  user: input.user,
  project: input.project,
  currentConversation: input.currentConversation,
  recentChats: input.recentChats ?? [],
  recentDocuments: input.recentDocuments ?? [],
  ...(input.conversationSummary ? { conversationSummary: input.conversationSummary } : {}),
});

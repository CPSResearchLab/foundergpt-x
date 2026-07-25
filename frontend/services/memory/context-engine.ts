import { listMemories, searchMemories, type Memory, type MemorySearchResult } from "./memory-v2";

export interface MemoryContextInput {
  userId?: string;
  projectId: string;
  projectName?: string;
  projectIndustry?: string;
  projectDescription?: string;
  sessionId?: string;
  message: string;
  recentLimit?: number;
  relevantLimit?: number;
}

export interface MemoryContextObject {
  userProfile: Memory | null;
  company: Memory | null;
  currentProject: { id: string; name: string; industry: string; description: string };
  recentMemories: readonly Memory[];
  relatedDocuments: readonly MemorySearchResult[];
  relatedChats: readonly MemorySearchResult[];
  goals: readonly Memory[];
  tasks: readonly Memory[];
  decisions: readonly Memory[];
  importantMemories: readonly Memory[];
}

export class MemoryRetriever {
  async retrieve(input: MemoryContextInput): Promise<MemoryContextObject> {
    const [recent, documents, chats, goals, tasks, decisions, important, user, company] = await Promise.all([
      listMemories({ projectId: input.projectId, limit: input.recentLimit ?? 12 }),
      searchMemories(input.message, { projectId: input.projectId, types: ["DOCUMENT", "document"], limit: 6 }),
      searchMemories(input.message, { projectId: input.projectId, types: ["CHAT", "chat"], limit: 8 }),
      listMemories({ projectId: input.projectId, types: ["GOAL", "goal"], limit: 8 }),
      listMemories({ projectId: input.projectId, types: ["TASK", "task"], limit: 8 }),
      listMemories({ projectId: input.projectId, types: ["DECISION", "business-decision"], limit: 8 }),
      listMemories({ projectId: input.projectId, limit: 8 }),
      input.userId ? searchMemories(input.userId, { types: ["USER", "founder"], limit: 1 }) : Promise.resolve([]),
      searchMemories(input.projectId, { types: ["COMPANY", "company"], limit: 1 }),
    ]);
    return {
      userProfile: user[0]?.memory ?? null,
      company: company[0]?.memory ?? null,
      currentProject: { id: input.projectId, name: input.projectName ?? "", industry: input.projectIndustry ?? "", description: input.projectDescription ?? "" },
      recentMemories: recent,
      relatedDocuments: documents,
      relatedChats: chats,
      goals,
      tasks,
      decisions,
      importantMemories: important.filter((memory) => memory.importance >= 0.75).sort((a, b) => b.importance - a.importance).slice(0, 8),
      // Relevant query results are merged by ContextAssembler.
    };
  }
}

export class ContextAssembler {
  assemble(retrieved: MemoryContextObject, relevant: readonly MemorySearchResult[] = []): MemoryContextObject & { relevantMemories: readonly MemorySearchResult[] } {
    const seen = new Set<string>();
    const uniqueRecent = [...retrieved.recentMemories, ...relevant.map((result) => result.memory)].filter((memory) => {
      if (seen.has(memory.id)) return false;
      seen.add(memory.id);
      return true;
    });
    return { ...retrieved, recentMemories: uniqueRecent, relevantMemories: relevant };
  }
}

export class ContextBuilder {
  constructor(private readonly retriever = new MemoryRetriever(), private readonly assembler = new ContextAssembler()) {}

  async build(input: MemoryContextInput): Promise<MemoryContextObject & { relevantMemories: readonly MemorySearchResult[] }> {
    const [retrieved, relevant] = await Promise.all([
      this.retriever.retrieve(input),
      searchMemories(input.message, { projectId: input.projectId, limit: input.relevantLimit ?? 12 }),
    ]);
    return this.assembler.assemble(retrieved, relevant);
  }
}

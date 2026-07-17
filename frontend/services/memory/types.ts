export type MemoryTimestamp = string;

export type MemoryPrimitive = boolean | number | string | null;

export type MemoryValue =
  | MemoryPrimitive
  | readonly MemoryValue[]
  | { readonly [key: string]: MemoryValue };

export interface MemoryReference {
  id: string;
  label?: string;
}

export interface MemoryRecord {
  id: string;
  ownerId: string;
  projectId?: string;
  createdAt: MemoryTimestamp;
  updatedAt: MemoryTimestamp;
  metadata?: Readonly<Record<string, MemoryValue>>;
}

export interface UserMemory extends MemoryRecord {
  userId: string;
  displayName?: string;
  email?: string;
  preferences: Readonly<Record<string, MemoryValue>>;
  facts: readonly string[];
}

export type StartupStage =
  | "idea"
  | "validation"
  | "pre-seed"
  | "seed"
  | "series-a"
  | "growth"
  | "established";

export interface GoalMemory extends MemoryRecord {
  title: string;
  description?: string;
  status: "not-started" | "in-progress" | "completed" | "paused" | "cancelled";
  targetDate?: MemoryTimestamp;
  priority?: "low" | "medium" | "high" | "critical";
}

export interface ProjectMemory extends MemoryRecord {
  name: string;
  mission: string;
  vision: string;
  startupStage: StartupStage;
  businessModel: string;
  industry: string;
  competitors: readonly string[];
  targetUsers: readonly string[];
  brandVoice: string;
  goals: readonly GoalMemory[];
  createdDocumentIds: readonly string[];
  recentConversationIds: readonly string[];
}

export interface ChatMessageMemory {
  id: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  createdAt: MemoryTimestamp;
}

export interface ChatMemory extends MemoryRecord {
  conversationId: string;
  title?: string;
  messages: readonly ChatMessageMemory[];
  summary?: string;
  lastMessageAt: MemoryTimestamp;
}

export interface DocumentAuthor {
  id: string;
  name?: string;
}

export type DocumentType =
  | "brief"
  | "business-plan"
  | "canvas"
  | "deck"
  | "note"
  | "report"
  | "research"
  | "specification"
  | "other";

export interface DocumentMemory extends MemoryRecord {
  title: string;
  type: DocumentType;
  content: string;
  version: number;
  tags: readonly string[];
  author: DocumentAuthor;
}

export interface TaskMemory extends MemoryRecord {
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "blocked" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high" | "critical";
  assigneeId?: string;
  dueAt?: MemoryTimestamp;
  goalId?: string;
}

export interface ConversationSummary extends MemoryRecord {
  conversationId: string;
  summary: string;
  keyDecisions: readonly string[];
  openQuestions: readonly string[];
  actionItems: readonly string[];
  sourceMessageIds: readonly string[];
}

export interface MemoryContext {
  user: UserMemory;
  project: ProjectMemory;
  currentConversation: ChatMemory;
  recentChats: readonly ChatMemory[];
  recentDocuments: readonly DocumentMemory[];
  conversationSummary?: ConversationSummary;
}

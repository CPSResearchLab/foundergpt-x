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

// ─── New: Message Memory Record ──────────────────────────────────────────────

/** All entity categories that can be extracted from a message. */
export interface ExtractedEntities {
  founderNames: readonly string[];
  companyNames: readonly string[];
  startupIdeas: readonly string[];
  industries: readonly string[];
  targetCustomers: readonly string[];
  businessModels: readonly string[];
  fundingMentions: readonly string[];
  goals: readonly string[];
  deadlines: readonly string[];
  technologies: readonly string[];
  competitors: readonly string[];
  problems: readonly string[];
  requirements: readonly string[];
  decisions: readonly string[];
}

/** A single stored message with full attribution and extracted entities. */
export interface MessageMemoryRecord extends MemoryRecord {
  /** The chat session this message belongs to. */
  sessionId: string;
  /** The user who owns this message. */
  userId: string;
  /** The role of the message author. */
  role: "user" | "assistant" | "system";
  /** The raw message content. */
  content: string;
  /** Tags derived from content and context. */
  tags: readonly string[];
  /** Entities extracted from the message content. */
  entities: ExtractedEntities;
  /** Relevance score used during retrieval (0–1). Set at write time to 1. */
  relevanceScore: number;
  /** Pinned memories are always preferred during ranking. */
  pinned?: boolean;
}

// ─── Ranked Memory ───────────────────────────────────────────────────────────

/** A ChatMessageEntry decorated with its ranking breakdown. */
export interface RankedMemory {
  entry: ChatMessageEntry;
  /** Exponential-decay score based on message age (0–1). */
  recencyScore: number;
  /** Heuristic score based on entity density and signal keywords (0–1). */
  importanceScore: number;
  /** Keyword-overlap score against the current project id and query (0–1). */
  projectRelevanceScore: number;
  /** Weighted composite: recency×0.35 + importance×0.35 + relevance×0.30 */
  score: number;
}

// ─── Retrieved Memory Context ────────────────────────────────────────────────

/** Structured context returned before every AI request. */
export interface RetrievedMemoryContext {
  /** Best recent memories for this user, ranked. */
  recentMemories: readonly RankedMemory[];
  /** Best memories for the current project, ranked. */
  projectMemories: readonly RankedMemory[];
  /** Chronological chat history for the current session, ranked. */
  chatHistory: readonly RankedMemory[];
}

// ─── Chat Message Entry ──────────────────────────────────────────────────────

/** Flat record stored automatically for every user/assistant message. */
export interface ChatMessageEntry extends MemoryRecord {
  userId: string;
  projectId: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  message: string;
  timestamp: MemoryTimestamp;
}

// ─── New: Retrieval ───────────────────────────────────────────────────────────

/** A ranked memory record returned from retrieval. */
export interface MemorySearchResult {
  record: MessageMemoryRecord;
  /** Combined score: recency × relevance (0–1). */
  score: number;
}

// ─── New: Structured Agent Context ───────────────────────────────────────────

/** Structured context passed to the agent system prompt. Never a raw string concat. */
export interface AgentMemoryContext {
  /** Current authenticated user. */
  user: {
    id: string;
    displayName?: string;
    email?: string;
  };
  /** Project-level facts. */
  project: {
    id: string;
    name: string;
    industry: string;
    description: string;
  };
  /** Aggregated business information extracted from all project memory. */
  businessInfo: {
    founderNames: readonly string[];
    companyNames: readonly string[];
    targetCustomers: readonly string[];
    businessModels: readonly string[];
    fundingMentions: readonly string[];
    technologies: readonly string[];
    competitors: readonly string[];
  };
  /** Long-term strategic facts extracted across all sessions for this project. */
  longTermFacts: {
    industries: readonly string[];
    goals: readonly string[];
    decisions: readonly string[];
    problems: readonly string[];
  };
  /** Semantically relevant past messages ranked by recency + relevance + pinned. */
  relevantHistory: ReadonlyArray<{
    role: "user" | "assistant";
    content: string;
    createdAt: string;
    score: number;
    pinned: boolean;
  }>;
  /** Recent messages from the current session (last N turns). */
  recentMessages: ReadonlyArray<{
    role: "user" | "assistant";
    content: string;
    createdAt: string;
  }>;
  /** Relevant documents for this project. */
  documents: ReadonlyArray<{
    title: string;
    type: string;
    summary: string;
  }>;
  /** Per-agent instructions injected into the system prompt. */
  agentInstructions: string;
}

import { getRelevantMemories, type Memory as V2Memory } from "./memory-v2";
import { getProjectRecords, getSessionRecords } from "./store";
import { retrieveRelevantMemory } from "./retrieval";
import { searchFounderMemory } from "./founder";
import { searchCompanyMemory } from "./company";
import { searchDecisionMemory } from "./decisions";
import { searchTaskMemory } from "./tasks";
import { searchResearchMemory } from "./research";
import { searchDocumentMemory } from "./documents";
import { memoryManager } from "./memory-manager";
import { DocumentSearch } from "../documents/search";
import type { DocumentMetadata } from "../documents/types";
import type {
  CompanyMemory,
  DecisionMemory,
  DocumentMemory,
  FounderMemory,
  ResearchMemory,
  TaskMemory,
} from "./types";

export interface FounderGPTContextInput {
  projectId: string;
  currentMessage: string;
  sessionId?: string;
  userId?: string;
  projectName?: string;
  projectIndustry?: string;
  projectDescription?: string;
}

export interface ContextMemory {
  id: string;
  type: string;
  summary: string;
  content: string;
  tags: readonly string[];
  source: string;
  updatedAt: string;
  score?: number;
}

export interface DocumentContextChunk {
  documentId: string;
  title: string;
  text: string;
  score: number;
  sectionPath: readonly string[];
  pageNumber?: number;
}

export interface FounderProfile {
  id?: string;
  name?: string;
  role?: string;
  summary: string;
  facts: readonly string[];
}

export interface CompanyProfile {
  id?: string;
  name?: string;
  industry?: string;
  summary: string;
  facts: readonly string[];
}

export interface FounderGPTContext {
  currentProject: {
    id: string;
    name: string;
    industry: string;
    description: string;
  };
  currentChat: {
    sessionId: string;
    currentMessage: string;
    recentMessages: ReadonlyArray<{
      role: "user" | "assistant" | "system";
      content: string;
      createdAt: string;
    }>;
  };
  relevantMemories: readonly ContextMemory[];
  recentDecisions: readonly ContextMemory[];
  goals: readonly ContextMemory[];
  tasks: readonly ContextMemory[];
  documents: readonly ContextMemory[];
  research: readonly ContextMemory[];
  importantMemories: readonly ContextMemory[];
  documentChunks: readonly DocumentContextChunk[];
  documentMetadata: ReadonlyArray<{
    documentId: string;
    title: string;
    filename: string;
    summary: string;
    metadata?: DocumentMetadata;
  }>;
  founderProfile: FounderProfile | null;
  companyProfile: CompanyProfile | null;
}

const LIMITS = {
  recentMessages: 12,
  relevantMemories: 12,
  decisions: 6,
  goals: 8,
  tasks: 8,
  documents: 6,
  research: 6,
  documentChunks: 8,
  itemSummaryChars: 280,
  itemContentChars: 700,
  profileFacts: 12,
} as const;

function clip(value: string, limit: number): string {
  return value.length <= limit ? value : `${value.slice(0, limit - 1)}…`;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function sortRecent<T extends { updatedAt: string }>(records: readonly T[], limit: number): T[] {
  return [...records]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

function fromV2(memory: V2Memory & { score?: number }): ContextMemory {
  return {
    id: memory.id,
    type: memory.type,
    summary: clip(memory.summary, LIMITS.itemSummaryChars),
    content: clip(memory.content, LIMITS.itemContentChars),
    tags: memory.tags,
    source: memory.source,
    updatedAt: memory.updatedAt,
    ...(memory.score === undefined ? {} : { score: memory.score }),
  };
}

function fromLegacy(
  memory: {
    id: string;
    updatedAt: string;
    summary?: string;
    content?: string;
    tags?: readonly string[];
    source?: string;
    title?: string;
  },
  type: string,
): ContextMemory {
  const content = memory.content ?? memory.summary ?? memory.title ?? "";
  return {
    id: memory.id,
    type,
    summary: clip(memory.summary ?? memory.title ?? content, LIMITS.itemSummaryChars),
    content: clip(content, LIMITS.itemContentChars),
    tags: memory.tags ?? [],
    source: memory.source ?? type,
    updatedAt: memory.updatedAt,
  };
}

function fromDecision(memory: DecisionMemory): ContextMemory {
  return fromLegacy({
    ...memory,
    content: [memory.decision, memory.rationale, memory.outcome].filter(Boolean).join(" — "),
  }, "business-decision");
}

function fromTask(memory: TaskMemory): ContextMemory {
  return fromLegacy({
    ...memory,
    content: [memory.title, memory.description, memory.status].filter(Boolean).join(" — "),
  }, "task");
}

function fromDocument(memory: DocumentMemory): ContextMemory {
  return fromLegacy(memory, "document");
}

function fromDocumentSearch(result: { document: { id: string; title: string; filename: string; summary?: { short: string }; metadata?: DocumentMetadata }; chunk: { text: string; sectionPath?: readonly string[]; pageNumber?: number }; score: number }): ContextMemory {
  return {
    id: result.document.id,
    type: "document",
    summary: clip(result.document.summary?.short ?? result.chunk.text, LIMITS.itemSummaryChars),
    content: clip(result.chunk.text, LIMITS.itemContentChars),
    tags: result.document.metadata?.tags ?? [],
    source: `document:${result.document.id}`,
    updatedAt: result.document.metadata?.modifiedDate ?? new Date(0).toISOString(),
    score: result.score,
  };
}

function fromResearch(memory: ResearchMemory): ContextMemory {
  return fromLegacy({
    ...memory,
    content: [memory.topic, ...memory.findings, ...memory.sources].join(" — "),
  }, "research");
}

function profileFromFounder(memory: FounderMemory | undefined): FounderProfile | null {
  if (!memory) return null;
  return {
    id: memory.id,
    name: memory.fullName,
    role: memory.role,
    summary: clip(memory.summary || memory.bio || "", LIMITS.itemContentChars),
    facts: [...memory.skills, ...memory.previousStartups].slice(0, LIMITS.profileFacts),
  };
}

function profileFromCompany(memory: CompanyMemory | undefined): CompanyProfile | null {
  if (!memory) return null;
  return {
    id: memory.id,
    name: memory.name,
    industry: memory.industry,
    summary: clip(memory.summary || memory.description, LIMITS.itemContentChars),
    facts: [memory.stage, memory.location, memory.website].filter(
      (fact): fact is string => Boolean(fact),
    ).slice(0, LIMITS.profileFacts),
  };
}

export async function buildFounderGPTContext(
  input: FounderGPTContextInput,
): Promise<FounderGPTContext> {
  const projectId = input.projectId || "global";
  const currentMessage = input.currentMessage.trim();
  const projectRecords = getProjectRecords(projectId);
  const sessionRecords = input.sessionId ? getSessionRecords(input.sessionId) : [];
  const documentSearch = new DocumentSearch();
  const brainContext = await memoryManager.buildContext({
    userId: input.userId,
    projectId,
    projectName: input.projectName,
    projectIndustry: input.projectIndustry,
    projectDescription: input.projectDescription,
    sessionId: input.sessionId,
    message: currentMessage,
  });

  const [
    relevantV2,
    founderRecords,
    companyRecords,
    decisions,
    tasks,
    documents,
    research,
    documentResults,
  ] = await Promise.all([
    getRelevantMemories(currentMessage, { projectId, limit: LIMITS.relevantMemories }),
    searchFounderMemory("", projectId),
    searchCompanyMemory("", projectId),
    searchDecisionMemory("", projectId),
    searchTaskMemory("", projectId),
    searchDocumentMemory("", projectId),
    searchResearchMemory("", projectId),
    documentSearch.search({ query: currentMessage, projectId, limit: LIMITS.documentChunks }),
  ]);

  const legacyRelevant = retrieveRelevantMemory({
    projectId,
    query: currentMessage,
    limit: LIMITS.relevantMemories,
  }).map((result) => ({
    id: result.record.id,
    type: "chat",
    summary: clip(result.record.content, LIMITS.itemSummaryChars),
    content: clip(result.record.content, LIMITS.itemContentChars),
    tags: result.record.tags,
    source: "chat",
    updatedAt: result.record.updatedAt,
    score: result.score,
  }));

  const goals = projectRecords.flatMap((record) =>
    record.entities.goals.map((goal, index) => ({
      id: `${record.id}-goal-${index}`,
      type: "goal",
      summary: clip(goal, LIMITS.itemSummaryChars),
      content: clip(goal, LIMITS.itemContentChars),
      tags: ["goal"],
      source: "chat",
      updatedAt: record.updatedAt,
    })),
  );

  const brainRecentMessages = brainContext.relatedChats.map((result) => ({
    role: result.memory.metadata.role === "system" ? "system" as const : result.memory.metadata.role === "assistant" ? "assistant" as const : "user" as const,
    content: result.memory.content,
    createdAt: result.memory.createdAt,
  }));
  const recentMessages = [...sessionRecords.map((record) => ({ role: record.role, content: record.content, createdAt: record.createdAt })), ...brainRecentMessages]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-LIMITS.recentMessages)
    .map((record) => ({
      role: record.role,
      content: clip(record.content, LIMITS.itemContentChars),
      createdAt: record.createdAt,
    }));

  const goalMemories: ContextMemory[] = [
    ...goals,
    ...brainContext.goals.map(fromV2),
  ];
  const documentContextMemories = [...documents.map(fromDocument), ...documentResults.map(fromDocumentSearch)]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, LIMITS.documents);

  return {
    currentProject: {
      id: projectId,
      name: input.projectName ?? "",
      industry: input.projectIndustry ?? "",
      description: clip(input.projectDescription ?? "", LIMITS.itemContentChars),
    },
    currentChat: {
      sessionId: input.sessionId ?? "",
      currentMessage: clip(currentMessage, LIMITS.itemContentChars),
      recentMessages,
    },
    relevantMemories: [...relevantV2.map(fromV2), ...brainContext.relevantMemories.map((result) => fromV2({ ...result.memory, score: result.score })), ...legacyRelevant]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, LIMITS.relevantMemories),
    recentDecisions: sortRecent(decisions.map(fromDecision), LIMITS.decisions),
    goals: unique(goalMemories.map((goal) => goal.content))
      .map((goal) => goalMemories.find((candidate) => candidate.content === goal)!)
      .slice(0, LIMITS.goals),
    tasks: sortRecent(tasks.map(fromTask), LIMITS.tasks),
    documents: documentContextMemories,
    research: sortRecent(research.map(fromResearch), LIMITS.research),
    importantMemories: brainContext.importantMemories.map(fromV2),
    documentChunks: documentResults.slice(0, LIMITS.documentChunks).map((result) => ({
      documentId: result.document.id,
      title: result.document.title,
      text: clip(result.chunk.text, LIMITS.itemContentChars),
      score: result.score,
      sectionPath: result.chunk.sectionPath ?? [],
      ...(result.chunk.pageNumber === undefined ? {} : { pageNumber: result.chunk.pageNumber }),
    })),
    documentMetadata: documentResults.slice(0, LIMITS.documents).map((result) => ({
      documentId: result.document.id,
      title: result.document.title,
      filename: result.document.filename,
      summary: result.document.summary?.short ?? "",
      ...(result.document.metadata ? { metadata: result.document.metadata } : {}),
    })),
    founderProfile: profileFromFounder(sortRecent(founderRecords, 1)[0] ?? undefined) ?? (brainContext.userProfile ? {
      id: brainContext.userProfile.id,
      name: brainContext.userProfile.title,
      summary: clip(brainContext.userProfile.summary, LIMITS.itemContentChars),
      facts: brainContext.userProfile.tags,
    } : null),
    companyProfile: profileFromCompany(sortRecent(companyRecords, 1)[0] ?? undefined) ?? (brainContext.company ? {
      id: brainContext.company.id,
      name: brainContext.company.title,
      industry: brainContext.company.metadata.industry as string | undefined,
      summary: clip(brainContext.company.summary, LIMITS.itemContentChars),
      facts: brainContext.company.tags,
    } : null),
  };
}

/** Compact, bounded serialization for system-prompt injection. */
export function serializeFounderGPTContext(context: FounderGPTContext): string {
  return [
    "FOUNDERGPT_CONTEXT_JSON:",
    JSON.stringify(context),
    "END_FOUNDERGPT_CONTEXT",
  ].join("\n");
}

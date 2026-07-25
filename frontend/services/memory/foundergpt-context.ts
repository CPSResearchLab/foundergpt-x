import { getRelevantMemories, type Memory as V2Memory } from "./memory-v2";
import { getProjectRecords, getSessionRecords } from "./store";
import { retrieveRelevantMemory } from "./retrieval";
import { searchFounderMemory } from "./founder";
import { searchCompanyMemory } from "./company";
import { searchDecisionMemory } from "./decisions";
import { searchTaskMemory } from "./tasks";
import { searchResearchMemory } from "./research";
import { searchDocumentMemory } from "./documents";
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

  const [
    relevantV2,
    founderRecords,
    companyRecords,
    decisions,
    tasks,
    documents,
    research,
  ] = await Promise.all([
    getRelevantMemories(currentMessage, { projectId, limit: LIMITS.relevantMemories }),
    searchFounderMemory("", projectId),
    searchCompanyMemory("", projectId),
    searchDecisionMemory("", projectId),
    searchTaskMemory("", projectId),
    searchDocumentMemory("", projectId),
    searchResearchMemory("", projectId),
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

  const recentMessages = [...sessionRecords]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-LIMITS.recentMessages)
    .map((record) => ({
      role: record.role,
      content: clip(record.content, LIMITS.itemContentChars),
      createdAt: record.createdAt,
    }));

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
    relevantMemories: [...relevantV2.map(fromV2), ...legacyRelevant]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, LIMITS.relevantMemories),
    recentDecisions: sortRecent(decisions.map(fromDecision), LIMITS.decisions),
    goals: unique(goals.map((goal) => goal.content))
      .map((goal) => goals.find((candidate) => candidate.content === goal)!)
      .slice(0, LIMITS.goals),
    tasks: sortRecent(tasks.map(fromTask), LIMITS.tasks),
    documents: sortRecent(documents.map(fromDocument), LIMITS.documents),
    research: sortRecent(research.map(fromResearch), LIMITS.research),
    founderProfile: profileFromFounder(sortRecent(founderRecords, 1)[0]),
    companyProfile: profileFromCompany(sortRecent(companyRecords, 1)[0]),
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

/**
 * Context Builder
 *
 * Assembles a structured AgentMemoryContext before every AI request.
 *
 * Pipeline (in order):
 *   1. Current User
 *   2. Current Project
 *   3. Project Description
 *   4. Business Information  (aggregated entities)
 *   5. Relevant Memory       (ranked: pinned > important > recent > project)
 *   6. Recent Chat           (last N turns of the current session)
 *   7. Relevant Documents    (top matching documents for this project)
 *   8. Agent Instructions    (per-agent system prompt addendum)
 *   9. Current User Prompt   (injected by the caller — not stored here)
 *
 * Token budget: each section is trimmed so the total serialized context
 * stays within TOKEN_BUDGET characters (≈ chars / 4 ≈ tokens).
 */

import type { AgentMemoryContext } from "./types";
import { getRecentSessionMessages, retrieveRelevantMemory } from "./retrieval";
import { getProjectRecords } from "./store";
import { searchDocumentMemory } from "./documents";

// ─── Budget ───────────────────────────────────────────────────────────────────

/** Approximate character budget for the full serialized context (~6 000 tokens). */
const CHAR_BUDGET = 24_000;

/** Maximum characters kept per individual message in recent/relevant history. */
const MSG_CHARS = 500;

/** Maximum characters kept per document summary. */
const DOC_CHARS = 300;

// ─── Input ────────────────────────────────────────────────────────────────────

export interface BuildContextInput {
  userId: string;
  userDisplayName?: string;
  userEmail?: string;
  projectId: string;
  projectName: string;
  projectIndustry: string;
  projectDescription: string;
  sessionId: string;
  /** The current user message — used as the retrieval query. */
  currentMessage: string;
  /** Per-agent instruction string injected into the system prompt. */
  agentInstructions?: string;
  /** How many recent messages to include. Default: 20. */
  recentMessageLimit?: number;
  /** How many relevant history items to include. Default: 8. */
  relevantHistoryLimit?: number;
  /** How many documents to include. Default: 4. */
  documentLimit?: number;
}

// ─── Builder ──────────────────────────────────────────────────────────────────

/** Build a structured AgentMemoryContext for the given request. */
export async function buildAgentMemoryContext(input: BuildContextInput): Promise<AgentMemoryContext> {
  const {
    userId,
    userDisplayName,
    userEmail,
    projectId,
    projectName,
    projectIndustry,
    projectDescription,
    sessionId,
    currentMessage,
    agentInstructions = "",
    recentMessageLimit = 20,
    relevantHistoryLimit = 8,
    documentLimit = 4,
  } = input;

  // ── Layer 1 & 2: User + Project ──────────────────────────────────────────
  const user: AgentMemoryContext["user"] = {
    id: userId,
    ...(userDisplayName ? { displayName: userDisplayName } : {}),
    ...(userEmail ? { email: userEmail } : {}),
  };

  const project: AgentMemoryContext["project"] = {
    id: projectId,
    name: projectName,
    industry: projectIndustry,
    description: projectDescription,
  };

  // ── Layer 4: Business Information + Long-term Facts ──────────────────────
  const allProjectRecords = getProjectRecords(projectId);

  const businessInfo: AgentMemoryContext["businessInfo"] = {
    founderNames: dedupe(allProjectRecords.flatMap((r) => [...r.entities.founderNames])),
    companyNames: dedupe(allProjectRecords.flatMap((r) => [...r.entities.companyNames])),
    targetCustomers: dedupe(allProjectRecords.flatMap((r) => [...r.entities.targetCustomers])),
    businessModels: dedupe(allProjectRecords.flatMap((r) => [...r.entities.businessModels])),
    fundingMentions: dedupe(allProjectRecords.flatMap((r) => [...r.entities.fundingMentions])),
    technologies: dedupe(allProjectRecords.flatMap((r) => [...r.entities.technologies])),
    competitors: dedupe(allProjectRecords.flatMap((r) => [...r.entities.competitors])),
  };

  const longTermFacts: AgentMemoryContext["longTermFacts"] = {
    industries: dedupe(allProjectRecords.flatMap((r) => [...r.entities.industries])),
    goals: dedupe(allProjectRecords.flatMap((r) => [...r.entities.goals])),
    decisions: dedupe(allProjectRecords.flatMap((r) => [...r.entities.decisions])),
    problems: dedupe(allProjectRecords.flatMap((r) => [...r.entities.problems])),
  };

  // ── Layer 5: Relevant Memory (ranked: pinned > important > recent > project) ──
  const relevantResults = retrieveRelevantMemory({
    projectId,
    query: currentMessage,
    limit: relevantHistoryLimit,
    excludeSessionId: sessionId,
  });

  const relevantHistory: AgentMemoryContext["relevantHistory"] = relevantResults
    .filter((r) => r.record.role === "user" || r.record.role === "assistant")
    .map((r) => ({
      role: r.record.role as "user" | "assistant",
      content: r.record.content.slice(0, MSG_CHARS),
      createdAt: r.record.createdAt,
      score: r.score,
      pinned: r.record.pinned ?? false,
    }));

  // ── Layer 6: Recent Chat ─────────────────────────────────────────────────
  const recentRaw = getRecentSessionMessages(sessionId, recentMessageLimit);
  const recentMessages: AgentMemoryContext["recentMessages"] = recentRaw
    .filter((r) => r.role === "user" || r.role === "assistant")
    .map((r) => ({
      role: r.role as "user" | "assistant",
      content: r.content.slice(0, MSG_CHARS),
      createdAt: r.createdAt,
    }));

  // ── Layer 7: Relevant Documents ──────────────────────────────────────────
  const rawDocs = await searchDocumentMemory(currentMessage, projectId);
  const documents: AgentMemoryContext["documents"] = rawDocs
    .slice(0, documentLimit)
    .map((d) => ({
      title: d.title,
      type: d.type,
      summary: d.content.slice(0, DOC_CHARS),
    }));

  const ctx: AgentMemoryContext = {
    user,
    project,
    businessInfo,
    longTermFacts,
    relevantHistory,
    recentMessages,
    documents,
    agentInstructions,
  };

  return applyTokenBudget(ctx);
}

// ─── Serializer ───────────────────────────────────────────────────────────────

/**
 * Serialize an AgentMemoryContext to a structured system prompt string.
 * Follows the 9-layer pipeline order. Each section is clearly labelled.
 */
export function serializeContextToSystemPrompt(ctx: AgentMemoryContext): string {
  const sections: string[] = [];

  // Layer 1: Current User
  const userLines = [`ID: ${ctx.user.id}`];
  if (ctx.user.displayName) userLines.push(`Name: ${ctx.user.displayName}`);
  if (ctx.user.email) userLines.push(`Email: ${ctx.user.email}`);
  sections.push("## Current User\n" + userLines.join("\n"));

  // Layer 2 & 3: Current Project + Description
  sections.push(
    [
      "## Current Project",
      `Name: ${ctx.project.name || "Not specified"}`,
      `Industry: ${ctx.project.industry || "Not specified"}`,
      `Description: ${ctx.project.description || "Not specified"}`,
    ].join("\n"),
  );

  // Layer 4: Business Information
  const b = ctx.businessInfo;
  const bizLines: string[] = [];
  if (b.founderNames.length > 0) bizLines.push(`Founder(s): ${b.founderNames.join(", ")}`);
  if (b.companyNames.length > 0) bizLines.push(`Company: ${b.companyNames.join(", ")}`);
  if (b.targetCustomers.length > 0) bizLines.push(`Target customers: ${b.targetCustomers.join(", ")}`);
  if (b.businessModels.length > 0) bizLines.push(`Business model: ${b.businessModels.join(", ")}`);
  if (b.fundingMentions.length > 0) bizLines.push(`Funding: ${b.fundingMentions.slice(0, 3).join(", ")}`);
  if (b.technologies.length > 0) bizLines.push(`Technologies: ${b.technologies.join(", ")}`);
  if (b.competitors.length > 0) bizLines.push(`Competitors: ${b.competitors.join(", ")}`);

  const f = ctx.longTermFacts;
  if (f.industries.length > 0) bizLines.push(`Industries: ${f.industries.join(", ")}`);
  if (f.goals.length > 0) bizLines.push(`Goals: ${f.goals.slice(0, 5).join(" | ")}`);
  if (f.decisions.length > 0) bizLines.push(`Key decisions: ${f.decisions.slice(0, 5).join(" | ")}`);
  if (f.problems.length > 0) bizLines.push(`Problems: ${f.problems.slice(0, 3).join(" | ")}`);

  if (bizLines.length > 0) {
    sections.push("## Business Information\n" + bizLines.join("\n"));
  }

  // Layer 5: Relevant Memory (pinned first, then by score)
  if (ctx.relevantHistory.length > 0) {
    const sorted = [...ctx.relevantHistory].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.score - a.score;
    });
    const lines = sorted.map(
      (m) => `${m.pinned ? "📌 " : ""}[${m.role.toUpperCase()}] ${m.content}`,
    );
    sections.push("## Relevant Memory\n" + lines.join("\n\n"));
  }

  // Layer 6: Recent Chat
  if (ctx.recentMessages.length > 0) {
    const lines = ctx.recentMessages.map((m) => `[${m.role.toUpperCase()}] ${m.content}`);
    sections.push("## Recent Chat\n" + lines.join("\n\n"));
  }

  // Layer 7: Relevant Documents
  if (ctx.documents.length > 0) {
    const lines = ctx.documents.map((d) => `[${d.type.toUpperCase()}] ${d.title}: ${d.summary}`);
    sections.push("## Relevant Documents\n" + lines.join("\n\n"));
  }

  // Layer 8: Agent Instructions
  if (ctx.agentInstructions) {
    sections.push("## Agent Instructions\n" + ctx.agentInstructions);
  }

  return sections.join("\n\n---\n\n");
}

// ─── Token Budget ─────────────────────────────────────────────────────────────

/**
 * Trim context layers until the serialized output fits within CHAR_BUDGET.
 * Drops from the least-important layers first:
 *   documents → relevantHistory (lowest score last) → recentMessages (oldest first)
 */
function applyTokenBudget(ctx: AgentMemoryContext): AgentMemoryContext {
  let result = ctx;

  if (serializeContextToSystemPrompt(result).length <= CHAR_BUDGET) return result;

  // 1. Trim documents
  let docs = [...result.documents];
  while (docs.length > 0 && serializeContextToSystemPrompt({ ...result, documents: docs }).length > CHAR_BUDGET) {
    docs = docs.slice(0, -1);
  }
  result = { ...result, documents: docs };
  if (serializeContextToSystemPrompt(result).length <= CHAR_BUDGET) return result;

  // 2. Trim relevant history (drop lowest-score non-pinned entries first)
  let history = [...result.relevantHistory].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.score - a.score;
  });
  while (history.length > 0 && serializeContextToSystemPrompt({ ...result, relevantHistory: history }).length > CHAR_BUDGET) {
    history = history.slice(0, -1);
  }
  result = { ...result, relevantHistory: history };
  if (serializeContextToSystemPrompt(result).length <= CHAR_BUDGET) return result;

  // 3. Trim recent messages (drop oldest first)
  let recent = [...result.recentMessages];
  while (recent.length > 1 && serializeContextToSystemPrompt({ ...result, recentMessages: recent }).length > CHAR_BUDGET) {
    recent = recent.slice(1);
  }
  result = { ...result, recentMessages: recent };

  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const v of values) {
    const key = v.toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(v);
    }
  }
  return result;
}

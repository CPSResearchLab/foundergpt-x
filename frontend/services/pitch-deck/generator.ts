/**
 * Pitch Deck Generator
 *
 * Assembles full context from:
 *   - Project memory (entities, goals, decisions, problems)
 *   - Recent chat history
 *   - Uploaded documents
 *   - Founder-provided additional context
 *
 * Calls the AI router with a structured prompt and parses the JSON response
 * into a fully typed PitchDeck.
 */

import { askAI } from "../ai/router";
import { getProjectRecords, getSessionRecords } from "../memory/store";
import { buildPitchDeckSystemPrompt, buildPitchDeckUserPrompt } from "./prompt";
import { SLIDE_ORDER } from "./types";
import type {
  GenerateDeckInput,
  PitchDeck,
  SlideContent,
  SlideType,
} from "./types";

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generatePitchDeck(input: GenerateDeckInput): Promise<PitchDeck> {
  const {
    projectId,
    ownerId,
    projectName,
    projectIndustry,
    projectDescription,
    targetInvestor = "Pre-seed / Seed VC",
    additionalContext = "",
  } = input;

  // ── Gather context from memory ────────────────────────────────────────────
  const projectRecords = getProjectRecords(projectId);

  const dedupe = (arr: string[]) => [...new Set(arr.map((s) => s.trim()).filter(Boolean))];

  const founderNames = dedupe(projectRecords.flatMap((r) => [...r.entities.founderNames]));
  const companyNames = dedupe(projectRecords.flatMap((r) => [...r.entities.companyNames]));
  const businessModels = dedupe(projectRecords.flatMap((r) => [...r.entities.businessModels]));
  const competitors = dedupe(projectRecords.flatMap((r) => [...r.entities.competitors]));
  const technologies = dedupe(projectRecords.flatMap((r) => [...r.entities.technologies]));
  const targetCustomers = dedupe(projectRecords.flatMap((r) => [...r.entities.targetCustomers]));
  const goals = dedupe(projectRecords.flatMap((r) => [...r.entities.goals]));
  const fundingMentions = dedupe(projectRecords.flatMap((r) => [...r.entities.fundingMentions]));
  const problems = dedupe(projectRecords.flatMap((r) => [...r.entities.problems]));
  const decisions = dedupe(projectRecords.flatMap((r) => [...r.entities.decisions]));
  const industries = dedupe(projectRecords.flatMap((r) => [...r.entities.industries]));

  // Recent chat summary — last 20 messages across all sessions for this project
  const recentMessages = projectRecords
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)
    .map((r) => `[${r.role.toUpperCase()}] ${r.content.slice(0, 300)}`)
    .join("\n");

  // ── Build and call AI ─────────────────────────────────────────────────────
  const systemPrompt = buildPitchDeckSystemPrompt();
  const userPrompt = buildPitchDeckUserPrompt({
    projectName,
    industry: projectIndustry || industries[0] || "",
    description: projectDescription,
    targetInvestor,
    founderNames,
    companyNames,
    businessModels,
    competitors,
    technologies,
    targetCustomers,
    goals,
    fundingMentions,
    problems,
    decisions,
    recentChatSummary: recentMessages,
    documentSummary: "",
    additionalContext,
  });

  const aiResponse = await askAI({
    systemPrompt,
    prompt: userPrompt,
    temperature: 0.7,
    maxTokens: 8000,
  });

  if (!aiResponse.success) {
    throw new Error(`AI generation failed: ${aiResponse.error ?? "Unknown error"}`);
  }

  // ── Parse response ────────────────────────────────────────────────────────
  const parsed = parseAIResponse(aiResponse.text);

  const now = new Date().toISOString();
  const deck: PitchDeck = {
    id: crypto.randomUUID(),
    projectId,
    ownerId,
    title: `${projectName || "Startup"} Pitch Deck`,
    oneLiner: parsed.oneLiner ?? `${projectName} — [one-liner not generated]`,
    targetInvestor,
    slides: parsed.slides,
    generatedAt: now,
    updatedAt: now,
    contextSnapshot: {
      projectName,
      industry: projectIndustry || industries[0] || "",
      stage: fundingMentions[0] ?? "early-stage",
      founderNames,
      companyNames,
      businessModels,
      competitors,
      goals,
      fundingMentions,
    },
  };

  return deck;
}

// ─── Parser ───────────────────────────────────────────────────────────────────

interface RawAIResponse {
  oneLiner?: string;
  slides?: Record<string, Partial<SlideContent>>;
}

function parseAIResponse(text: string): { oneLiner: string; slides: Record<SlideType, SlideContent> } {
  // Strip markdown code fences if present
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  let raw: RawAIResponse;
  try {
    raw = JSON.parse(cleaned) as RawAIResponse;
  } catch {
    // Try to extract JSON object from the text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI response did not contain valid JSON");
    raw = JSON.parse(match[0]) as RawAIResponse;
  }

  const slides = {} as Record<SlideType, SlideContent>;
  for (const slideType of SLIDE_ORDER) {
    const raw_slide = raw.slides?.[slideType] ?? {};
    slides[slideType] = normalizeSlide(raw_slide);
  }

  return {
    oneLiner: typeof raw.oneLiner === "string" ? raw.oneLiner : "",
    slides,
  };
}

function normalizeSlide(raw: Partial<SlideContent>): SlideContent {
  return {
    headline: typeof raw.headline === "string" ? raw.headline : "[Headline not generated]",
    body: Array.isArray(raw.body) ? raw.body.map(String) : [],
    speakerNotes: typeof raw.speakerNotes === "string" ? raw.speakerNotes : "",
    visualSuggestion: typeof raw.visualSuggestion === "string" ? raw.visualSuggestion : "",
    chartSuggestion: typeof raw.chartSuggestion === "string" ? raw.chartSuggestion : "",
    iconSuggestions: Array.isArray(raw.iconSuggestions) ? raw.iconSuggestions.map(String) : [],
    imageSuggestion: typeof raw.imageSuggestion === "string" ? raw.imageSuggestion : "",
    proofGaps: Array.isArray(raw.proofGaps) ? raw.proofGaps.map(String) : [],
  };
}

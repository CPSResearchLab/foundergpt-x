import type { DocumentEntity, DocumentSummary } from "./types";

export class SummaryEngine {
  summarize(text: string, entities: readonly DocumentEntity[] = []): DocumentSummary {
    const clean = text.replace(/\s+/g, " ").trim();
    const sentences = clean.match(/[^.!?]+[.!?]+/gu) ?? (clean ? [clean] : []);
    const short = clip(sentences.slice(0, 2).join(" ") || clean, 320);
    const long = clip(sentences.slice(0, 8).join(" ") || clean, 1600);
    const keywords = topKeywords(clean);
    const topics = keywords.slice(0, 8);
    return {
      short, long, keywords, topics,
      importantEntities: entities.slice(0, 30),
      actionItems: extractLines(text, /(?:action item|todo|task|next step|follow[- ]?up|need to|should)\s*[:\-]?\s*([^.!?\n]{5,160})/giu),
      questions: extractQuestions(text),
      risks: extractLines(text, /(?:risk|risky|blocker|concern|threat|challenge|issue)\s*[:\-]?\s*([^.!?\n]{5,160})/giu),
      goals: extractLines(text, /(?:goal|objective|target|aim)\s*[:\-]?\s*([^.!?\n]{5,160})/giu),
      decisions: extractLines(text, /(?:decision|decided|agreed|we will|chosen)\s*[:\-]?\s*([^.!?\n]{5,160})/giu),
    };
  }
}

function clip(value: string, limit: number): string { return value.length <= limit ? value : `${value.slice(0, limit - 3).trimEnd()}...`; }
function extractLines(text: string, pattern: RegExp): string[] {
  const values = new Set<string>();
  for (const match of text.matchAll(pattern)) { const value = (match[1] ?? "").replace(/\s+/g, " ").trim(); if (value) values.add(value); }
  return [...values].slice(0, 20);
}
function extractQuestions(text: string): string[] {
  return (text.match(/[^.!?\n]*\?+/gu) ?? []).map((value) => value.trim()).filter((value) => value.length > 4).slice(0, 20);
}
function topKeywords(text: string): string[] {
  const stop = new Set(["the", "and", "for", "with", "that", "this", "from", "are", "was", "were", "will", "have", "has", "not", "but", "you", "your"]);
  const counts = new Map<string, number>();
  for (const token of text.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/u)) {
    if (token.length > 3 && !stop.has(token)) counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 20).map(([value]) => value);
}

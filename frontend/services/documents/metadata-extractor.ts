import type { DocumentEntity, DocumentFileType, DocumentMetadata } from "./types";
import type { ParseResult } from "./parser";

export interface MetadataExtractionInput {
  filename: string;
  fileType: DocumentFileType;
  projectId: string;
  fileSize: number;
  contentHash: string;
  text: string;
  parseResult: ParseResult;
  createdAt?: string;
  modifiedAt?: string;
  tags?: readonly string[];
}

export class MetadataExtractor {
  extract(input: MetadataExtractionInput): DocumentMetadata {
    const title = input.filename.replace(/\.[^.]+$/u, "").replace(/[_-]+/g, " ").trim() || "Untitled document";
    const author = firstMatch(input.text, /(?:author|written by|prepared by)\s*[:\-]\s*([^\n]+)/iu);
    const keywords = topKeywords(input.text);
    const entities = extractEntities(input.text);
    return {
      title, ...(author ? { author } : {}), ...(input.parseResult.pageCount ? { pageCount: input.parseResult.pageCount } : {}),
      fileSize: input.fileSize, ...(input.createdAt ? { creationDate: input.createdAt } : {}), ...(input.modifiedAt ? { modifiedDate: input.modifiedAt } : {}),
      keywords, language: detectLanguage(input.text), projectId: input.projectId,
      tags: [...new Set([input.fileType, ...keywords.slice(0, 6), ...(input.tags ?? [])])], entities,
      topics: keywords.slice(0, 8), actionItems: [], questions: [], risks: [], goals: [], decisions: [], contentHash: input.contentHash, sourceFilename: input.filename,
    };
  }
}

function firstMatch(value: string, pattern: RegExp): string | undefined { return pattern.exec(value)?.[1]?.trim(); }
function extractEntities(text: string): DocumentEntity[] {
  const patterns: Array<[DocumentEntity["type"], RegExp]> = [
    ["company", /(?:company|startup|business|organization)\s*(?:is|:)?\s*([A-Z][\w&.-]{2,}(?:\s+[A-Z][\w&.-]{2,})?)/gu],
    ["person", /(?:by|author|founder|investor|contact)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/gu],
    ["product", /(?:product|platform|app|service)\s*(?:is|:)?\s*([A-Z][\w-]{2,}(?:\s+[A-Z][\w-]{2,})?)/gu],
    ["technology", /\b(React|Next\.js|TypeScript|JavaScript|Python|Java|Go|Rust|AWS|Bedrock|PostgreSQL|MongoDB|OpenAI|Claude|Kubernetes|Docker)\b/giu],
    ["investor", /(?:investor|fund|vc|venture capital)\s*[:\-]?\s*([A-Z][\w&.-]{2,}(?:\s+[A-Z][\w&.-]{2,})?)/gu],
    ["competitor", /(?:competitor|alternative|versus|vs\.)\s*[:\-]?\s*([A-Z][\w&.-]{2,}(?:\s+[A-Z][\w&.-]{2,})?)/gu],
    ["research-paper", /(?:paper|study|research)\s*[:\-]?\s*([^\n.]{5,120})/giu],
    ["date", /\b(?:\d{1,2}[/-])?\d{1,2}[/-]\d{2,4}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,\s*\d{4})?\b/giu],
    ["number", /\b\$?\d+(?:[,.]\d+)*(?:%|\s*(?:million|billion|k|m))?\b/giu],
    ["url", /\bhttps?:\/\/[^\s)]+/giu],
    ["email", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu],
    ["phone", /\b(?:\+?\d[\d ()-]{7,}\d)\b/gu],
  ];
  const output: DocumentEntity[] = [];
  const seen = new Set<string>();
  for (const [type, pattern] of patterns) for (const match of text.matchAll(pattern)) {
    const value = (match[1] ?? match[0]).replace(/\s+/g, " ").trim();
    const key = `${type}:${value.toLocaleLowerCase()}`;
    if (value && !seen.has(key)) { seen.add(key); output.push({ type, value }); }
  }
  return output.slice(0, 100);
}
function detectLanguage(text: string): string {
  const sample = text.toLocaleLowerCase();
  const englishSignals = [" the ", " and ", " this ", " with ", " is "].filter((word) => sample.includes(word)).length;
  return englishSignals >= 2 ? "en" : "unknown";
}
function topKeywords(text: string): string[] {
  const stop = new Set(["the", "and", "for", "with", "that", "this", "from", "are", "was", "were", "will", "have", "has", "not"]);
  const counts = new Map<string, number>();
  for (const token of text.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/u)) if (token.length > 3 && !stop.has(token)) counts.set(token, (counts.get(token) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 20).map(([value]) => value);
}

/**
 * Document Chunker
 *
 * Splits extracted document text into overlapping chunks suitable for
 * embedding and retrieval.
 *
 * Strategy:
 *   - Target chunk size: 800 characters
 *   - Overlap: 150 characters (preserves context across boundaries)
 *   - Split on paragraph boundaries first, then sentence boundaries,
 *     then hard-cut at the character limit.
 */

import type { DocumentChunk } from "./types";

const CHUNK_SIZE = 800;
const OVERLAP = 150;

// Stop-words to exclude from keyword extraction
const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "by","from","is","are","was","were","be","been","being","have","has",
  "had","do","does","did","will","would","could","should","may","might",
  "this","that","these","those","it","its","we","our","you","your","they",
  "their","he","she","his","her","as","if","so","not","no","up","out",
]);

export function chunkDocument(
  documentId: string,
  projectId: string,
  text: string,
): DocumentChunk[] {
  const segments = splitIntoSegments(text);
  const chunks: DocumentChunk[] = [];
  let charOffset = 0;
  let index = 0;

  for (const segment of segments) {
    chunks.push(makeChunk(documentId, projectId, index, segment, charOffset));
    charOffset += segment.length;
    index++;
  }

  return chunks;
}

// ─── Segmentation ─────────────────────────────────────────────────────────────

function splitIntoSegments(text: string): string[] {
  // Split on double newlines (paragraphs) first
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const segments: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length + 2 <= CHUNK_SIZE) {
      current = current ? `${current}\n\n${para}` : para;
    } else {
      if (current) {
        segments.push(current);
        // Carry overlap from end of current into next segment
        current = overlapText(current) + (current ? "\n\n" : "") + para;
      } else {
        // Single paragraph exceeds chunk size — split by sentences
        const sentenceChunks = splitBySentences(para);
        segments.push(...sentenceChunks.slice(0, -1));
        current = sentenceChunks[sentenceChunks.length - 1] ?? "";
      }
    }
  }

  if (current.trim()) segments.push(current.trim());
  return segments;
}

function splitBySentences(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length <= CHUNK_SIZE) {
      current += sentence;
    } else {
      if (current) chunks.push(current.trim());
      current = overlapText(current) + sentence;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function overlapText(text: string): string {
  return text.length > OVERLAP ? text.slice(-OVERLAP) : text;
}

// ─── Chunk factory ────────────────────────────────────────────────────────────

function makeChunk(
  documentId: string,
  projectId: string,
  index: number,
  text: string,
  charOffset: number,
): DocumentChunk {
  return {
    id: crypto.randomUUID(),
    documentId,
    projectId,
    index,
    text,
    charOffset,
    keywords: extractKeywords(text),
    embedding: [], // populated by embeddings.ts
    createdAt: new Date().toISOString(),
  };
}

// ─── Keyword extraction ───────────────────────────────────────────────────────

export function extractKeywords(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  // TF: count occurrences
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);

  // Return top-30 by frequency
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([term]) => term);
}

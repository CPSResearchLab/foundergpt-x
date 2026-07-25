import type { DocumentChunk } from "./types";
import { extractKeywords } from "./chunker";

export interface ChunkOptions {
  maxChunkSize?: number;
  overlap?: number;
}

interface TextSection {
  text: string;
  heading?: string;
  sectionPath: string[];
  pageNumber?: number;
  paragraphIndex: number;
  offset: number;
}

const DEFAULT_MAX_CHUNK_SIZE = 1200;
const DEFAULT_OVERLAP = 120;

export class ChunkEngine {
  chunk(documentId: string, projectId: string, text: string, options: ChunkOptions = {}): DocumentChunk[] {
    const maxChunkSize = Math.max(200, options.maxChunkSize ?? DEFAULT_MAX_CHUNK_SIZE);
    const overlap = Math.max(0, Math.min(maxChunkSize - 1, options.overlap ?? DEFAULT_OVERLAP));
    const sections = this.toSections(text);
    const chunks: DocumentChunk[] = [];
    let index = 0;
    for (const section of sections) {
      for (const part of splitOversized(section.text, maxChunkSize, overlap)) {
        chunks.push({
          id: createId(), documentId, projectId, index, text: part.text,
          charOffset: section.offset + part.offset, keywords: extractKeywords(part.text), embedding: [],
          createdAt: new Date().toISOString(), heading: section.heading, sectionPath: section.sectionPath,
          pageNumber: section.pageNumber, paragraphIndex: section.paragraphIndex, tokenCount: part.text.split(/\s+/u).filter(Boolean).length,
        });
        index++;
      }
    }
    return chunks;
  }

  private toSections(text: string): TextSection[] {
    const pages = text.split("\f");
    const sections: TextSection[] = [];
    const hierarchy: string[] = [];
    let documentOffset = 0;
    let paragraphIndex = 0;
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      const lines = page.split(/\r?\n/u);
      let current: string[] = [];
      let currentHeading: string | undefined;
      let currentOffset = documentOffset;
      const flush = (): void => {
        const value = current.join("\n").trim();
        if (value) sections.push({ text: value, heading: currentHeading, sectionPath: [...hierarchy], pageNumber: pages.length > 1 ? pageIndex + 1 : undefined, paragraphIndex, offset: currentOffset });
        if (value) paragraphIndex++;
        current = [];
      };
      for (const line of lines) {
        const heading = parseHeading(line);
        if (heading) {
          flush();
          const level = heading.level;
          hierarchy.splice(level - 1);
          hierarchy[level - 1] = heading.text;
          currentHeading = heading.text;
          currentOffset = documentOffset + page.indexOf(line);
        } else if (!line.trim()) {
          flush();
          currentOffset = documentOffset + page.indexOf(line);
        } else {
          if (current.length === 0) currentOffset = documentOffset + page.indexOf(line);
          current.push(line);
        }
      }
      flush();
      documentOffset += page.length + 1;
    }
    return sections.length ? sections : [{ text, sectionPath: [], paragraphIndex: 0, offset: 0 }];
  }
}

function splitOversized(text: string, maxSize: number, overlap: number): Array<{ text: string; offset: number }> {
  if (text.length <= maxSize) return [{ text, offset: 0 }];
  const parts: Array<{ text: string; offset: number }> = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(text.length, start + maxSize);
    if (end < text.length) {
      const boundary = text.lastIndexOf(" ", end);
      if (boundary > start + Math.floor(maxSize * 0.5)) end = boundary;
    }
    parts.push({ text: text.slice(start, end).trim(), offset: start });
    if (end >= text.length) break;
    start = Math.max(start + 1, end - overlap);
  }
  return parts;
}

function parseHeading(line: string): { level: number; text: string } | null {
  const markdown = /^(#{1,6})\s+(.+)$/u.exec(line.trim());
  if (markdown) return { level: markdown[1].length, text: markdown[2].trim() };
  if (/^[A-Z][A-Z0-9\s:&-]{3,80}$/u.test(line.trim())) return { level: 1, text: line.trim() };
  return null;
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `chunk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Document Parser
 *
 * Extracts plain text from uploaded file buffers.
 * All parsing runs server-side only (Node.js runtime).
 *
 * Supported formats:
 *   PDF   — pdf-parse
 *   DOCX  — mammoth
 *   TXT   — UTF-8 decode
 *   MD    — UTF-8 decode (markdown kept as-is for chunking)
 *   CSV   — csv-parse (rows joined as readable text)
 *   PPTX  — XML extraction (no external dep needed)
 *   JSON, HTML, and code — UTF-8 text with lightweight normalization
 *   Images — placeholder result; OCR can be added behind the same interface
 */

import type { DocumentFileType } from "./types";

export interface ParseResult {
  text: string;
  /** Approximate page/slide count if available. */
  pageCount?: number;
}

export async function parseDocument(buffer: Buffer, fileType: DocumentFileType): Promise<ParseResult> {
  switch (fileType) {
    case "pdf":
      return parsePdf(buffer);
    case "docx":
      return parseDocx(buffer);
    case "txt":
    case "md":
    case "json":
    case "code":
    case "html":
      return { text: buffer.toString("utf-8") };
    case "csv":
      return parseCsv(buffer);
    case "pptx":
      return parsePptx(buffer);
    case "image":
      return { text: "", pageCount: 1 };
    default:
      throw new Error(`Unsupported file type: ${fileType as string}`);
  }
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  // Dynamic import keeps this out of the client bundle
  type PdfResult = { text: string; numpages: number };
  type PdfParser = (input: Buffer) => Promise<PdfResult>;
  const pdfModule = await import("pdf-parse") as unknown as { default?: PdfParser } & PdfParser;
  const parser: PdfParser = typeof pdfModule.default === "function" ? pdfModule.default : pdfModule;
  const result = await parser(buffer);
  return { text: result.text.trim(), pageCount: result.numpages };
}

// ─── DOCX ─────────────────────────────────────────────────────────────────────

async function parseDocx(buffer: Buffer): Promise<ParseResult> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value.trim() };
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

async function parseCsv(buffer: Buffer): Promise<ParseResult> {
  const { parse } = await import("csv-parse/sync");
  const records = parse(buffer, { skip_empty_lines: true, trim: true }) as string[][];
  // Convert rows to readable text: "col1 | col2 | col3"
  const text = records.map((row) => row.join(" | ")).join("\n");
  return { text };
}

// ─── PPTX ─────────────────────────────────────────────────────────────────────
// PPTX is a ZIP archive. We extract text from slide XML without an extra dep.

async function parsePptx(buffer: Buffer): Promise<ParseResult> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort();

  const texts: string[] = [];
  for (const name of slideFiles) {
    const xml = await zip.files[name].async("string");
    // Extract all <a:t> text nodes
    const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) ?? [];
    const slideText = matches
      .map((m) => m.replace(/<[^>]+>/g, "").trim())
      .filter(Boolean)
      .join(" ");
    if (slideText) texts.push(slideText);
  }

  return { text: texts.join("\n\n"), pageCount: slideFiles.length };
}

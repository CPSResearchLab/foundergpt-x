import { extractEntities } from "./extractor";
import { saveMemory, searchMemory, type Memory, type MemoryType } from "./memory-v2";

export interface KnowledgeExtractionContext {
  projectId: string;
  source: string;
}

export interface ExtractedKnowledge {
  type: MemoryType;
  value: string;
  importance: number;
}

const MAX_FACTS_PER_TYPE = 8;

function clean(value: string): string {
  return value
    .replace(/^[\s:;,.\-–—]+|[\s:;,.\-–—]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matches(text: string, patterns: readonly RegExp[]): string[] {
  const values = new Set<string>();
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const value = clean(match[1] ?? match[0]);
      if (value.length >= 3 && value.length <= 180) values.add(value);
    }
  }
  return [...values];
}

const TASK_PATTERNS = [
  /(?:task|todo|action item|next step|follow[- ]?up)\s*[:\-]?\s*([^.!?\n]{5,100})/gi,
  /(?:we|i)\s+(?:need|have|plan)\s+to\s+([^.!?\n]{5,100})/gi,
];

const INVESTOR_PATTERNS = [
  /(?:investors?|backed by|funded by|raised from|investment from)\s*[:\-]?\s*([^.!?\n]{2,100})/gi,
];

const PRODUCT_IDEA_PATTERNS = [
  /(?:product idea|feature idea|new feature|product concept)\s*[:\-]?\s*([^.!?\n]{5,100})/gi,
];

const RESEARCH_PATTERNS = [
  /(?:research(?: shows| suggests| indicates)?|market study|user study|customer research|finding(?:s)?|evidence)\s*[:\-]?\s*([^.!?\n]{5,120})/gi,
];

function add(
  result: ExtractedKnowledge[],
  type: MemoryType,
  values: readonly string[],
  importance: number,
): void {
  const seen = new Set(result.filter((item) => item.type === type).map((item) => item.value.toLowerCase()));
  for (const raw of values.slice(0, MAX_FACTS_PER_TYPE)) {
    const value = clean(raw);
    const key = value.toLowerCase();
    if (value && !seen.has(key)) {
      seen.add(key);
      result.push({ type, value, importance });
    }
  }
}

/** Pure deterministic extraction. It never calls an AI provider or the network. */
export function extractKnowledge(content: string): ExtractedKnowledge[] {
  const entities = extractEntities(content);
  const result: ExtractedKnowledge[] = [];

  add(result, "goal", entities.goals, 0.8);
  add(result, "deadline", entities.deadlines, 0.9);
  add(result, "business-decision", entities.decisions, 0.9);
  add(result, "product-feature", [...entities.productIdeas, ...matches(content, PRODUCT_IDEA_PATTERNS)], 0.7);
  add(result, "competitor", entities.competitors, 0.7);
  add(result, "company", entities.targetCustomers, 0.6);
  add(result, "investor-note", [...entities.investorMentions, ...matches(content, INVESTOR_PATTERNS)], 0.8);
  add(result, "research", [...entities.researchFindings, ...matches(content, RESEARCH_PATTERNS)], 0.7);
  add(result, "task", [...entities.requirements, ...matches(content, TASK_PATTERNS)], 0.75);

  return result;
}

function contentFor(type: MemoryType, value: string): string {
  switch (type) {
    case "business-decision": return `Decision: ${value}`;
    case "deadline": return `Deadline: ${value}`;
    case "investor-note": return `Investor: ${value}`;
    case "product-feature": return `Product idea: ${value}`;
    default: return value;
  }
}

/** Extract and persist response knowledge in Memory Engine V2. */
export async function storeExtractedKnowledge(
  content: string,
  context: KnowledgeExtractionContext,
): Promise<Memory[]> {
  const extracted = extractKnowledge(content);
  const stored: Memory[] = [];

  for (const item of extracted) {
    const existing = await searchMemory(item.value, {
      projectId: context.projectId,
      types: [item.type],
      limit: 20,
    });
    if (existing.some((memory) => memory.content.toLowerCase() === contentFor(item.type, item.value).toLowerCase())) {
      continue;
    }

    stored.push(await saveMemory({
      type: item.type,
      projectId: context.projectId,
      importance: item.importance,
      tags: [item.type, "deterministic", "ai-response"],
      summary: item.value,
      source: context.source,
      content: contentFor(item.type, item.value),
    }));
  }

  return stored;
}

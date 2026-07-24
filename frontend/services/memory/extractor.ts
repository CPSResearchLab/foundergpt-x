/**
 * Entity Extractor
 *
 * Extracts structured entities from raw message text using deterministic
 * pattern matching. No LLM call. No network. No latency.
 *
 * Covers all required categories:
 *   Founder Name, Company Name, Startup Idea, Industry, Target Customers,
 *   Business Model, Funding, Goals, Deadlines, Technology, Competitors,
 *   Problems, Requirements, Important Decisions
 */

import type { ExtractedEntities } from "./types";

// ─── Pattern library ─────────────────────────────────────────────────────────

const FOUNDER_PATTERNS = [
  /(?:i(?:'m| am)|my name is|founder(?:ed by)?|co-founder(?:ed by)?|ceo(?:\s+is)?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is the founder|founded|co-founded)/gi,
];

const COMPANY_PATTERNS = [
  /(?:company(?:\s+is)?|startup(?:\s+is)?|business(?:\s+is)?|called|named|brand(?:ed as)?)\s+([A-Z][A-Za-z0-9\s&.,-]{1,40}?)(?:\s*[,.]|\s+(?:is|are|was|will))/gi,
  /([A-Z][A-Za-z0-9]{2,}(?:\s+[A-Z][A-Za-z0-9]{2,})?)\s+(?:Inc\.|LLC|Ltd\.|Corp\.|GmbH)/gi,
];

const IDEA_PATTERNS = [
  /(?:building|creating|developing|launching|working on)\s+(?:a|an|the)?\s*([^.!?\n]{10,80})/gi,
  /(?:idea(?:\s+is)?|concept(?:\s+is)?|product(?:\s+is)?|service(?:\s+is)?)\s*[:\-–]?\s*([^.!?\n]{10,80})/gi,
];

const INDUSTRY_PATTERNS = [
  /(?:in(?:dustry|dustries)?|sector|space|market|vertical)\s*[:\-–]?\s*(fintech|healthtech|edtech|proptech|legaltech|insurtech|agritech|cleantech|saas|b2b|b2c|d2c|e-?commerce|marketplace|platform|ai|ml|blockchain|crypto|web3|gaming|media|logistics|supply chain|hr tech|martech|adtech|cybersecurity|iot|robotics|biotech|pharma|retail|fashion|food(?:tech)?|travel|hospitality|real estate|construction|manufacturing|automotive|aerospace|energy|sustainability|climate(?:tech)?)/gi,
  /(fintech|healthtech|edtech|proptech|legaltech|insurtech|agritech|cleantech|saas|b2b|b2c|d2c|e-?commerce|marketplace|ai startup|ml startup|blockchain|crypto|web3|gaming|media|logistics|hr tech|martech|adtech|cybersecurity|iot|robotics|biotech|pharma|retail|fashion|foodtech|traveltech|real estate|construction|manufacturing|automotive|aerospace|energy|climatetech)/gi,
];

const CUSTOMER_PATTERNS = [
  /(?:target(?:ing)?|customers?(?:\s+are)?|users?(?:\s+are)?|audience(?:\s+is)?|serving|for)\s+([^.!?\n]{5,60}?)(?:\s*[,.]|\s+(?:who|that|with))/gi,
  /(?:small businesses?|smbs?|enterprises?|startups?|consumers?|individuals?|professionals?|developers?|designers?|marketers?|founders?|ctos?|ceos?|students?|teachers?|parents?|seniors?|millennials?|gen z)/gi,
];

const BUSINESS_MODEL_PATTERNS = [
  /(?:business model(?:\s+is)?|revenue(?:\s+model)?(?:\s+is)?|monetiz(?:e|ing|ation)(?:\s+through)?|charging|pricing)\s*[:\-–]?\s*([^.!?\n]{5,80})/gi,
  /(?:subscription|saas|freemium|marketplace|transaction fee|commission|licensing|advertising|usage-based|pay-per-use|enterprise|white-label|api|platform fee)/gi,
];

const FUNDING_PATTERNS = [
  /(?:rais(?:ing|ed)|funding|investment|round|valuation|seed|series [a-c]|pre-seed|angel|vc|venture capital|bootstrapped?|self-funded)\s*[:\-–]?\s*([^.!?\n]{0,60})/gi,
  /\$\s*[\d,.]+\s*(?:k|m|million|billion|thousand)?(?:\s+(?:in funding|raised|investment|round))?/gi,
];

const GOAL_PATTERNS = [
  /(?:goal(?:s)?(?:\s+(?:is|are))?|aim(?:ing)?(?:\s+to)?|objective(?:s)?(?:\s+(?:is|are))?|want(?:ing)?\s+to|trying\s+to|plan(?:ning)?\s+to|hope\s+to|need\s+to)\s+([^.!?\n]{5,100})/gi,
  /(?:by end of|by q[1-4]|this (?:year|quarter|month)|next (?:year|quarter|month))\s+(?:we(?:'ll)?\s+)?([^.!?\n]{5,80})/gi,
];

const DEADLINE_PATTERNS = [
  /(?:by|before|deadline(?:\s+is)?|due(?:\s+(?:date|by))?|launch(?:ing)?\s+(?:on|by|in))\s+((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|q[1-4]\s+\d{4}|end of \d{4}|next (?:week|month|quarter|year)|in \d+\s+(?:days?|weeks?|months?))/gi,
];

const TECH_PATTERNS = [
  /(?:using|built(?:\s+with)?|powered by|stack(?:\s+is)?|technology(?:\s+is)?|tech(?:\s+stack)?(?:\s+is)?|framework(?:\s+is)?)\s*[:\-–]?\s*([^.!?\n]{3,80})/gi,
  /\b(react|next\.?js|vue|angular|svelte|node(?:\.js)?|python|django|flask|fastapi|rails|laravel|spring|java|kotlin|swift|flutter|react native|typescript|javascript|rust|go(?:lang)?|postgres(?:ql)?|mysql|mongodb|redis|elasticsearch|aws|gcp|azure|vercel|supabase|firebase|openai|anthropic|groq|gemini|llama|gpt-4|claude|langchain|pinecone|weaviate|chroma|docker|kubernetes|terraform|graphql|rest api|websocket|stripe|twilio|sendgrid)\b/gi,
];

const COMPETITOR_PATTERNS = [
  /(?:competitor(?:s)?(?:\s+(?:is|are))?|competing(?:\s+with)?|alternative(?:s)?(?:\s+to)?|vs\.?\s+|versus\s+|like\s+(?:but|except)|similar\s+to)\s+([A-Z][A-Za-z0-9\s&.,-]{1,40}?)(?:\s*[,.]|\s+(?:is|are|but|which))/gi,
  /(?:unlike|better than|different from)\s+([A-Z][A-Za-z0-9\s&.,-]{1,40}?)(?:\s*[,.]|\s+(?:we|our|it))/gi,
];

const PROBLEM_PATTERNS = [
  /(?:problem(?:\s+(?:is|we(?:'re)?\s+solving))?|pain\s+point(?:s)?(?:\s+(?:is|are))?|challenge(?:s)?(?:\s+(?:is|are))?|issue(?:s)?(?:\s+(?:is|are))?|struggle(?:s)?(?:\s+with)?|frustrat(?:ed|ing)\s+(?:by|with))\s*[:\-–]?\s*([^.!?\n]{5,100})/gi,
];

const REQUIREMENT_PATTERNS = [
  /(?:need(?:s)?(?:\s+to)?|require(?:s|ment(?:s)?)?(?:\s+(?:is|are))?|must\s+have|should\s+have|critical(?:ly)?\s+need(?:s)?|essential(?:ly)?)\s+([^.!?\n]{5,100})/gi,
];

const DECISION_PATTERNS = [
  /(?:decided?(?:\s+to)?|decision(?:\s+(?:is|was))?|chose(?:n)?\s+to|going\s+with|will\s+(?:use|go\s+with|build|focus)|committed?\s+to)\s+([^.!?\n]{5,100})/gi,
];

// ─── Extraction helpers ───────────────────────────────────────────────────────

function extractMatches(text: string, patterns: RegExp[]): string[] {
  const results = new Set<string>();
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const value = (match[1] ?? match[0]).trim().replace(/[,.]$/, "").trim();
      if (value.length >= 2 && value.length <= 120) {
        results.add(value);
      }
    }
  }
  return Array.from(results);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Extract all entity categories from a message string. Pure, synchronous, zero side-effects. */
export function extractEntities(content: string): ExtractedEntities {
  return {
    founderNames: extractMatches(content, FOUNDER_PATTERNS),
    companyNames: extractMatches(content, COMPANY_PATTERNS),
    startupIdeas: extractMatches(content, IDEA_PATTERNS),
    industries: extractMatches(content, INDUSTRY_PATTERNS),
    targetCustomers: extractMatches(content, CUSTOMER_PATTERNS),
    businessModels: extractMatches(content, BUSINESS_MODEL_PATTERNS),
    fundingMentions: extractMatches(content, FUNDING_PATTERNS),
    goals: extractMatches(content, GOAL_PATTERNS),
    deadlines: extractMatches(content, DEADLINE_PATTERNS),
    technologies: extractMatches(content, TECH_PATTERNS),
    competitors: extractMatches(content, COMPETITOR_PATTERNS),
    problems: extractMatches(content, PROBLEM_PATTERNS),
    requirements: extractMatches(content, REQUIREMENT_PATTERNS),
    decisions: extractMatches(content, DECISION_PATTERNS),
  };
}

/** Derive tags from content and extracted entities. */
export function deriveTags(content: string, entities: ExtractedEntities): string[] {
  const tags = new Set<string>();

  if (entities.industries.length > 0) tags.add("industry");
  if (entities.goals.length > 0) tags.add("goal");
  if (entities.decisions.length > 0) tags.add("decision");
  if (entities.competitors.length > 0) tags.add("competitor");
  if (entities.technologies.length > 0) tags.add("technology");
  if (entities.fundingMentions.length > 0) tags.add("funding");
  if (entities.deadlines.length > 0) tags.add("deadline");
  if (entities.problems.length > 0) tags.add("problem");
  if (entities.requirements.length > 0) tags.add("requirement");
  if (entities.targetCustomers.length > 0) tags.add("customer");
  if (entities.businessModels.length > 0) tags.add("business-model");
  if (entities.companyNames.length > 0) tags.add("company");
  if (entities.founderNames.length > 0) tags.add("founder");

  // Content-length signal
  if (content.length > 200) tags.add("detailed");

  return Array.from(tags);
}

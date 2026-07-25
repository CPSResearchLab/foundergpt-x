import type { AgentResponse } from "./types";
import type { ConsensusOpinion, ConsensusResult } from "./orchestration-types";

export class ConsensusEngine {
  resolve(results: ReadonlyArray<{ agent: string; response: AgentResponse }>): ConsensusResult {
    const successful = results.filter((result) => result.response.success && result.response.content.trim());
    const opinions: ConsensusOpinion[] = successful.map((result) => ({ agent: result.agent, content: result.response.content.trim(), confidence: confidence(result.response.content), rationale: `Specialist output from ${result.agent}.` }));
    if (opinions.length === 0) return { recommendation: "No specialist completed successfully.", confidence: 0, rationale: "All specialist executions failed or returned empty output.", opinions: [] };
    const commonTerms = commonKeywords(opinions.map((opinion) => opinion.content));
    const sections = opinions.map((opinion) => `## ${opinion.agent}\n${opinion.content}`);
    const agreement = commonTerms.length ? `Shared signals: ${commonTerms.join(", ")}.` : "Specialists did not share enough vocabulary for a deterministic agreement signal.";
    const average = opinions.reduce((sum, opinion) => sum + opinion.confidence, 0) / opinions.length;
    return { recommendation: sections.join("\n\n"), confidence: Math.min(1, average + (commonTerms.length > 2 ? 0.1 : 0)), rationale: agreement, opinions };
  }
}

function confidence(content: string): number { return Math.min(1, 0.35 + Math.min(content.length / 4000, 0.4) + (/[\n]/u.test(content) ? 0.1 : 0) + (/[0-9]/u.test(content) ? 0.1 : 0)); }
function commonKeywords(contents: readonly string[]): string[] {
  if (contents.length < 2) return [];
  const stop = new Set(["this", "that", "with", "from", "will", "should", "their", "about", "there", "which", "would", "could"]);
  const sets = contents.map((content) => new Set(content.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/u).filter((token) => token.length > 4 && !stop.has(token))));
  return [...sets[0]].filter((token) => sets.every((set) => set.has(token))).slice(0, 8);
}

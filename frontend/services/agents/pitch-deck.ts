import { BaseAgent } from "./base";
import { PITCH_DECK_AGENT_PROMPT } from "./prompts";
import type { AgentCapability } from "./types";

export class PitchDeckAgent extends BaseAgent {
  readonly name = "pitch-deck";
  readonly displayLabel = "Pitch Deck";
  readonly description = "Investor narrative, slide structure, and fundraising story.";
  readonly icon = "📊";
  readonly capabilities: readonly AgentCapability[] = [
    { id: "narrative", name: "Narrative", description: "Build a compelling investor story arc." },
    { id: "slide-structure", name: "Slide Structure", description: "Design the optimal slide sequence." },
    { id: "one-liner", name: "One-Liner", description: "Craft a memorable elevator pitch." },
    { id: "proof-gaps", name: "Proof Gaps", description: "Identify claims that need supporting evidence." },
    { id: "market-sizing", name: "Market Sizing", description: "Structure TAM/SAM/SOM analysis." },
    { id: "traction-framing", name: "Traction Framing", description: "Present traction in the most compelling way." },
  ];
  protected readonly promptDefinition = PITCH_DECK_AGENT_PROMPT;
}

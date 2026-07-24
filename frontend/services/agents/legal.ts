import { BaseAgent } from "./base";
import { LEGAL_AGENT_PROMPT } from "./prompts";
import type { AgentCapability } from "./types";

export class LegalAgent extends BaseAgent {
  readonly name = "legal";
  readonly displayLabel = "Legal";
  readonly description = "Legal risk mapping, startup structures, agreements, and due diligence prep.";
  readonly icon = "⚖️";
  readonly capabilities: readonly AgentCapability[] = [
    { id: "entity-structure", name: "Entity Structure", description: "Advise on company structure options." },
    { id: "founder-agreements", name: "Founder Agreements", description: "Surface key founder agreement considerations." },
    { id: "ip-protection", name: "IP Protection", description: "Identify intellectual property risks and protections." },
    { id: "employment-law", name: "Employment Law", description: "Flag employment and contractor considerations." },
    { id: "privacy-compliance", name: "Privacy & Compliance", description: "Surface GDPR, CCPA, and data compliance issues." },
    { id: "due-diligence", name: "Legal Due Diligence", description: "Prepare for investor legal due diligence." },
  ];
  protected readonly promptDefinition = LEGAL_AGENT_PROMPT;
}

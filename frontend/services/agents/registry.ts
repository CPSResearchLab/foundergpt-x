import type { Agent } from "./types";
import { CeoAgent } from "./ceo";
import { CtoAgent } from "./cto";
import { InvestorAgent } from "./investor";
import { PitchDeckAgent } from "./pitch-deck";
import { BusinessPlanAgent } from "./business-plan";
import { MarketingAgent } from "./marketing";
import { FinanceAgent } from "./finance";
import { SalesAgent } from "./sales";
import { LegalAgent } from "./legal";
import { ResearchAgent } from "./research";
import { ProductAgent } from "./product";
import { GrowthAgent } from "./growth";

export class AgentRegistry {
  private readonly agents = new Map<string, Agent>();

  register(agent: Agent): this {
    this.agents.set(agent.name, agent);
    return this;
  }

  get(name: string): Agent | undefined {
    return this.agents.get(name);
  }

  has(name: string): boolean {
    return this.agents.has(name);
  }

  /** Returns all registered agents in registration order. */
  list(): Agent[] {
    return Array.from(this.agents.values());
  }
}

export const agentRegistry = new AgentRegistry()
  .register(new CeoAgent())
  .register(new CtoAgent())
  .register(new InvestorAgent())
  .register(new PitchDeckAgent())
  .register(new BusinessPlanAgent())
  .register(new MarketingAgent())
  .register(new FinanceAgent())
  .register(new SalesAgent())
  .register(new LegalAgent())
  .register(new ResearchAgent())
  .register(new ProductAgent())
  .register(new GrowthAgent());

/** Serialisable agent descriptor — safe to pass to the frontend. */
export interface AgentDescriptor {
  id: string;
  label: string;
  description: string;
  icon: string;
}

/** Returns a plain serialisable list of all agents for the UI. */
export function getAgentDescriptors(): AgentDescriptor[] {
  return agentRegistry.list().map((a) => ({
    id: a.name,
    label: a.displayLabel,
    description: a.description,
    icon: a.icon,
  }));
}

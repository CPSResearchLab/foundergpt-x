import type { Agent } from "./types";
import { ResearchAgent } from "./research";

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
}

export const agentRegistry = new AgentRegistry().register(new ResearchAgent());

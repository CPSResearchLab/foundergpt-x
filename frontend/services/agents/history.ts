import type { AgentExecutionRecord } from "./types";
import type { AgentHistoryStore } from "./orchestration-types";

export class InMemoryAgentHistoryStore implements AgentHistoryStore {
  private readonly records = new Map<string, AgentExecutionRecord>();
  async save(record: AgentExecutionRecord): Promise<void> { this.records.set(record.executionId, structuredClone(record)); }
  async get(executionId: string): Promise<AgentExecutionRecord | null> { const record = this.records.get(executionId); return record ? structuredClone(record) : null; }
  async list(limit = 50): Promise<AgentExecutionRecord[]> { return [...this.records.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, Math.max(0, limit)).map((record) => structuredClone(record)); }
}

export const agentHistoryStore = new InMemoryAgentHistoryStore();

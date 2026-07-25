import { memoryManager } from "../memory/memory-manager";

export class AgentMemoryStore {
  private readonly working = new Map<string, Map<string, string>>();
  private readonly recent = new Map<string, string[]>();

  setWorking(executionId: string, key: string, value: string): void { const values = this.working.get(executionId) ?? new Map<string, string>(); values.set(key, value); this.working.set(executionId, values); }
  getWorking(executionId: string): Readonly<Record<string, string>> { return Object.fromEntries(this.working.get(executionId) ?? []); }
  addRecent(executionId: string, value: string): void { const values = this.recent.get(executionId) ?? []; values.push(value); this.recent.set(executionId, values.slice(-20)); }
  async saveLongTerm(executionId: string, agent: string, projectId: string, content: string): Promise<void> {
    await memoryManager.save({ id: `agent-memory-${executionId}-${agent}`, type: "NOTE", projectId, title: `${agent} execution memory`, summary: content.slice(0, 240), content, tags: ["agent-memory", agent], importance: 0.65, source: `agent:${agent}`, metadata: { executionId, agent } });
  }
  snapshot(executionId: string): { working: Readonly<Record<string, string>>; recent: readonly string[] } { return { working: this.getWorking(executionId), recent: [...(this.recent.get(executionId) ?? [])] }; }
}

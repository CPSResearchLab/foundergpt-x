import type { AgentData, AgentMessage } from "./types";

export type AgentMessageListener = (message: AgentMessage) => void | Promise<void>;

export class AgentCommunicationBus {
  private readonly messages: AgentMessage[] = [];
  private readonly listeners = new Set<AgentMessageListener>();

  async publish(input: Omit<AgentMessage, "id" | "createdAt">): Promise<AgentMessage> {
    const message: AgentMessage = { ...input, id: createId(), createdAt: new Date().toISOString() };
    this.messages.push(message);
    await Promise.all([...this.listeners].map((listener) => listener(message)));
    return structuredClone(message);
  }
  subscribe(listener: AgentMessageListener): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  list(executionId?: string): AgentMessage[] { return this.messages.filter((message) => !executionId || message.executionId === executionId).map((message) => structuredClone(message)); }
  clear(executionId?: string): void {
    if (!executionId) { this.messages.length = 0; return; }
    for (let index = this.messages.length - 1; index >= 0; index--) if (this.messages[index].executionId === executionId) this.messages.splice(index, 1);
  }
  request(executionId: string, from: string, to: string, content: string, metadata?: Readonly<Record<string, AgentData>>): Promise<AgentMessage> { return this.publish({ executionId, from, to, type: "request", content, ...(metadata ? { metadata } : {}) }); }
  response(executionId: string, from: string, to: string, content: string): Promise<AgentMessage> { return this.publish({ executionId, from, to, type: "response", content }); }
  handoff(executionId: string, from: string, to: string, content: string): Promise<AgentMessage> { return this.publish({ executionId, from, to, type: "handoff", content }); }
  status(executionId: string, from: string, content: string): Promise<AgentMessage> { return this.publish({ executionId, from, to: "broadcast", type: "status", content }); }
}

function createId(): string { return globalThis.crypto?.randomUUID?.() ?? `message_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`; }

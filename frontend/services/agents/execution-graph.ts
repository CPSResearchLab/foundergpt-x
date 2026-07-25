import type { TaskNode } from "./orchestration-types";
import type { AgentResponse } from "./types";
import type { ExecutionNodeResult, GraphExecutionResult } from "./orchestration-types";

export interface ExecutionGraph {
  nodes: readonly TaskNode[];
}

export interface NodeExecutionContext {
  node: TaskNode;
  dependencies: Readonly<Record<string, ExecutionNodeResult>>;
}

export type NodeExecutor = (context: NodeExecutionContext) => Promise<AgentResponse>;

export interface GraphExecutorOptions {
  timeoutMs?: number;
  retries?: number;
  onStatus?: (node: TaskNode, status: TaskNode["status"]) => void | Promise<void>;
}

export class ExecutionGraphRunner {
  async run(graph: ExecutionGraph, execute: NodeExecutor, options: GraphExecutorOptions = {}): Promise<GraphExecutionResult> {
    validateGraph(graph.nodes);
    const results = new Map<string, ExecutionNodeResult>();
    const pending = new Map(graph.nodes.map((node) => [node.id, node]));
    const retries = Math.max(0, options.retries ?? 1);

    while (pending.size > 0) {
      const blocked = [...pending.values()].filter((node) => node.dependencies.some((dependency) => results.get(dependency)?.status === "failed" || results.get(dependency)?.status === "blocked"));
      for (const node of blocked) {
        results.set(node.id, resultFor(node, "blocked", 0, "Dependency failed or was blocked.")); pending.delete(node.id); await options.onStatus?.(node, "blocked");
      }
      const ready = [...pending.values()].filter((node) => node.dependencies.every((dependency) => results.get(dependency)?.status === "completed"));
      if (ready.length === 0) {
        if (pending.size === 0) break;
        for (const node of pending.values()) { results.set(node.id, resultFor(node, "blocked", 0, "Execution graph has unresolved dependencies.")); await options.onStatus?.(node, "blocked"); }
        pending.clear(); break;
      }
      await Promise.all(ready.map(async (node) => {
        pending.delete(node.id); await options.onStatus?.(node, "running");
        const startedAt = new Date().toISOString(); let attempts = 0; let response: AgentResponse | undefined; let error = "";
        for (attempts = 1; attempts <= retries + 1; attempts++) {
          try {
            response = await withTimeout(execute({ node, dependencies: Object.fromEntries(results) }), options.timeoutMs ?? 120_000);
            if (response.success) break;
            error = response.error ?? "Agent failed.";
          } catch (caught: unknown) { error = caught instanceof Error ? caught.message : "Agent execution failed."; }
        }
        const completedAt = new Date().toISOString();
        const status = response?.success ? "completed" : "failed";
        results.set(node.id, { nodeId: node.id, agent: node.agent, status, ...(response ? { response } : {}), ...(status === "failed" ? { error } : {}), attempts, startedAt, completedAt });
        await options.onStatus?.(node, status);
      }));
    }
    return { nodes: Object.fromEntries(results), completed: [...results.values()].every((result) => result.status === "completed") };
  }
}

function resultFor(node: TaskNode, status: "blocked" | "failed", attempts: number, error: string): ExecutionNodeResult { const now = new Date().toISOString(); return { nodeId: node.id, agent: node.agent, status, error, attempts, startedAt: now, completedAt: now }; }
function validateGraph(nodes: readonly TaskNode[]): void {
  const ids = new Set(nodes.map((node) => node.id));
  if (ids.size !== nodes.length) throw new Error("Execution graph contains duplicate node IDs.");
  for (const node of nodes) for (const dependency of node.dependencies) if (!ids.has(dependency)) throw new Error(`Unknown graph dependency: ${dependency}.`);
  const visiting = new Set<string>(); const visited = new Set<string>(); const byId = new Map(nodes.map((node) => [node.id, node]));
  const visit = (id: string): void => { if (visiting.has(id)) throw new Error("Execution graph contains a cycle."); if (visited.has(id)) return; visiting.add(id); for (const dependency of byId.get(id)?.dependencies ?? []) visit(dependency); visiting.delete(id); visited.add(id); };
  for (const node of nodes) visit(node.id);
}
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> { return new Promise<T>((resolve, reject) => { const timer = setTimeout(() => reject(new Error(`Execution timed out after ${timeoutMs}ms.`)), timeoutMs); promise.then((value) => { clearTimeout(timer); resolve(value); }, (error: unknown) => { clearTimeout(timer); reject(error); }); }); }

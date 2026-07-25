import type { AgentRequest } from "./types";
import type { TaskNode, TaskPlan } from "./orchestration-types";
import type { AgentRegistry } from "./registry";

export class TaskPlanner {
  plan(request: AgentRequest, registry: AgentRegistry): TaskPlan {
    const prompt = request.prompt.trim();
    const root = registry.has(request.agent) ? request.agent : "ceo";
    const agents = this.selectAgents(prompt, root, registry, request.orchestration?.maxAgents ?? 8);
    const nodes: TaskNode[] = agents.map((agent, index) => ({ id: `${agent}-${index + 1}`, agent, task: this.taskFor(agent, prompt), dependencies: [], priority: registry.getDefinition(agent)?.priority ?? 50, status: "pending" }));
    this.assignDependencies(nodes, prompt);
    return { id: createId("plan"), goal: prompt, rootAgent: root, nodes, createdAt: new Date().toISOString() };
  }

  shouldOrchestrate(prompt: string): boolean {
    return /\b(investor package|fundraising package|business plan|pitch deck|go[- ]to[- ]market|cross[- ]functional|compare|consensus|multiple perspectives|strategy and execution|operating plan)\b/i.test(prompt) || prompt.length > 700;
  }

  private selectAgents(prompt: string, root: string, registry: AgentRegistry, maxAgents: number): string[] {
    const lower = prompt.toLocaleLowerCase();
    const selected = new Set<string>([root]);
    if (/investor|fundrais|raise|pitch|due diligence/i.test(lower)) ["investor", "business-plan", "finance", "pitch-deck", "research", "legal"].forEach((agent) => selected.add(agent));
    if (/market|competitor|research|customer/i.test(lower)) ["research", "marketing", "sales"].forEach((agent) => selected.add(agent));
    if (/product|roadmap|mvp|technical|architecture/i.test(lower)) ["product", "cto"].forEach((agent) => selected.add(agent));
    if (/growth|acquisition|retention|launch/i.test(lower)) ["growth", "marketing", "sales"].forEach((agent) => selected.add(agent));
    return [...selected].filter((agent) => registry.has(agent)).slice(0, Math.max(1, maxAgents));
  }

  private taskFor(agent: string, prompt: string): string {
    const tasks: Record<string, string> = {
      ceo: "Define the strategic objective, decision criteria, and final priorities.", investor: "Evaluate investor readiness, proof gaps, and fundraising implications.", "business-plan": "Translate the request into an integrated business and operating plan.", finance: "Model financial assumptions, scenarios, risks, and required inputs.", "pitch-deck": "Shape the investor narrative, structure, and evidence requirements.", marketing: "Develop positioning, messaging, and go-to-market implications.", legal: "Identify legal, compliance, and diligence risks for qualified counsel.", research: "Gather and structure evidence, competitors, market context, and unknowns.", product: "Define product scope, user outcomes, roadmap, and prioritisation.", cto: "Assess technical architecture, implementation constraints, and risks.", growth: "Define measurable growth experiments and funnel priorities.", sales: "Define ICP, sales motion, outreach, and pipeline actions.",
    };
    return `${tasks[agent] ?? "Provide your specialist assessment."}\nOriginal request: ${prompt}`;
  }

  private assignDependencies(nodes: TaskNode[], prompt: string): void {
    const byAgent = new Map(nodes.map((node) => [node.agent, node]));
    const addDependency = (agent: string, dependency: string): void => { const node = byAgent.get(agent); if (node && byAgent.has(dependency)) node.dependencies = [...new Set([...node.dependencies, byAgent.get(dependency)!.id])]; };
    const collaborative = this.shouldOrchestrate(prompt);
    if (!collaborative) return;
    ["investor", "business-plan", "finance", "research", "marketing", "legal", "product", "cto", "sales", "growth"].forEach((agent) => addDependency(agent, "ceo"));
    addDependency("pitch-deck", "investor"); addDependency("pitch-deck", "business-plan"); addDependency("pitch-deck", "finance");
    addDependency("marketing", "pitch-deck"); addDependency("legal", "pitch-deck");
  }
}

function createId(prefix: string): string { return `${prefix}_${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`}`; }

import type { AgentRegistry } from "./registry";
import type { AgentExecutionLogger, AgentRequest, AgentResponse } from "./types";

export class AgentManager {
  constructor(private readonly registry: AgentRegistry, private readonly logExecution: AgentExecutionLogger = () => undefined) {}

  async execute(request: AgentRequest): Promise<AgentResponse> {
    const agent = this.registry.get(request.agent);
    if (!agent) {
      const now = new Date().toISOString();
      const response: AgentResponse = { success: false, content: "", error: `Unknown agent: ${request.agent}.`, metadata: { executionId: `agent-${Date.now()}`, agent: request.agent, startedAt: now, completedAt: now, durationMs: 0 } };
      await this.log(response);
      return response;
    }

    try {
      const response = await agent.execute(request);
      await this.log(response);
      return response;
    } catch (error: unknown) {
      const now = new Date().toISOString();
      const response: AgentResponse = {
        success: false,
        content: "",
        error: error instanceof Error ? error.message : "Agent execution failed.",
        metadata: { executionId: `agent-${Date.now()}`, agent: request.agent, startedAt: now, completedAt: now, durationMs: 0 },
      };
      await this.log(response);
      return response;
    }
  }

  private async log(response: AgentResponse): Promise<void> {
    try {
      await this.logExecution(response.metadata);
    } catch (error: unknown) {
      console.error("Agent execution metadata logging failed:", error);
    }
  }
}

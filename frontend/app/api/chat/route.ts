import { NextResponse } from "next/server";
import { AgentManager } from "@/services/agents/manager";
import { agentRegistry } from "@/services/agents/registry";
import { storeChatMessage } from "@/services/memory/pipeline";
import { buildAgentMemoryContext, serializeContextToSystemPrompt } from "@/services/memory/context-builder";

const MAX_MESSAGE_LENGTH = 4000;
const SAFE_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;

/** Strip characters that could break log integrity (newlines, carriage returns). */
function sanitizeLogField(value: string): string {
  return value.replace(/[\r\n]/g, " ").slice(0, 128);
}

export const runtime = "nodejs";

const agentManager = new AgentManager(agentRegistry, (metadata) => {
  console.info("Agent execution completed", metadata);
});

export async function GET() {
  return NextResponse.json({ status: "ok" });
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const b = body as Record<string, unknown>;

    const message = typeof b.message === "string" ? b.message.trim() : undefined;
    const agent = typeof b.agent === "string" ? b.agent.trim() : undefined;

    // Validate agent against the registry allowlist — rejects unknown/injected agent names
    if (agent && !agentRegistry.has(agent)) {
      return NextResponse.json({ error: "Unknown agent." }, { status: 400 });
    }

    // Enforce message length cap to limit prompt injection surface
    if (message && message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: "Message exceeds maximum allowed length." }, { status: 400 });
    }

    // Optional attribution fields — provided by project chat, absent from standalone chat
    const userId = typeof b.userId === "string" && SAFE_ID_RE.test(b.userId) ? b.userId : "anonymous";
    const projectId = typeof b.projectId === "string" && SAFE_ID_RE.test(b.projectId) ? b.projectId : "global";
    const sessionId = typeof b.sessionId === "string" && SAFE_ID_RE.test(b.sessionId) ? b.sessionId : "global";
    const projectName = typeof b.projectName === "string" ? b.projectName : "";
    const projectIndustry = typeof b.projectIndustry === "string" ? b.projectIndustry : "";
    const projectDescription = typeof b.projectDescription === "string" ? b.projectDescription : "";

    if (!agent || !message) {
      return NextResponse.json(
        { error: "An agent and a non-empty message are required." },
        { status: 400 },
      );
    }

    // 1. Store the user message through the memory pipeline
    const userRecord = storeChatMessage({
      userId,
      projectId,
      sessionId,
      role: "user",
      content: message,
    });

    // 2. Build structured memory context for this request
    const memoryCtx = await buildAgentMemoryContext({
      userId,
      projectId,
      projectName,
      projectIndustry,
      projectDescription,
      sessionId,
      currentMessage: message,
    });

    // 3. Serialize context to a structured system prompt addendum
    const memorySystemPrompt = serializeContextToSystemPrompt(memoryCtx);

    // 4. Execute the agent with memory context injected
    const result = await agentManager.execute({
      agent,
      prompt: message,
      context: {
        data: {
          memorySystemPrompt,
          projectId,
          sessionId,
          userId,
        },
      },
    });

    if (!result.success) {
      console.error("Agent chat request failed:", result.error);
      return NextResponse.json(
        { error: "Unable to generate a response right now." },
        { status: 502 },
      );
    }

    // 5. Store the assistant response through the memory pipeline
    storeChatMessage({
      userId,
      projectId,
      sessionId,
      role: "assistant",
      content: result.content,
    });

    console.info("Memory pipeline: stored message pair", {
      userRecordId: sanitizeLogField(userRecord.id),
      sessionId: sanitizeLogField(sessionId),
      projectId: sanitizeLogField(projectId),
      entityCount: Object.values(userRecord.entities).flat().length,
    });

    return NextResponse.json({ response: result.content, metadata: result.metadata });
  } catch (error) {
    console.error("Invalid chat request:", error);
    return NextResponse.json(
      { error: "Unable to process the chat request." },
      { status: 400 },
    );
  }
}

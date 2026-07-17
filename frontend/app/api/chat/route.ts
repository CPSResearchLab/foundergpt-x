import { NextResponse } from "next/server";
import { AgentManager } from "@/services/agents/manager";
import { agentRegistry } from "@/services/agents/registry";

export const runtime = "nodejs";

const agentManager = new AgentManager(agentRegistry, (metadata) => {
  console.info("Agent execution completed", metadata);
});

export async function GET() {
  return NextResponse.json({
    status: "ok",
  });
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? body.message
        : undefined;
    const agent =
      typeof body === "object" && body !== null && "agent" in body
        ? body.agent
        : undefined;

    if (typeof agent !== "string" || !agent.trim() || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "An agent and a non-empty message are required." },
        { status: 400 }
      );
    }

    const result = await agentManager.execute({
      agent: agent.trim(),
      prompt: message.trim(),
    });

    if (!result.success) {
      console.error("Agent chat request failed:", result.error);
      return NextResponse.json(
        { error: "Unable to generate a response right now." },
        { status: 502 }
      );
    }

    return NextResponse.json({ response: result.content, metadata: result.metadata });
  } catch (error) {
    console.error("Invalid chat request:", error);
    return NextResponse.json(
      { error: "Unable to process the chat request." },
      { status: 400 }
    );
  }
}

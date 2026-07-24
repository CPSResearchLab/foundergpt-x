import { NextResponse } from "next/server";
import { getAgentDescriptors } from "@/services/agents/registry";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ agents: getAgentDescriptors() });
}

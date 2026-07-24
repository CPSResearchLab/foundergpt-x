import { NextResponse } from "next/server";
import { generatePitchDeck } from "@/services/pitch-deck/generator";
import { saveDeck, listAllDecks } from "@/services/pitch-deck/store";
import type { GenerateDeckInput } from "@/services/pitch-deck/types";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ decks: listAllDecks() });
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    const projectId = typeof b.projectId === "string" ? b.projectId.trim() : "global";
    const ownerId = typeof b.ownerId === "string" ? b.ownerId.trim() : "anonymous";
    const projectName = typeof b.projectName === "string" ? b.projectName.trim() : "";
    const projectIndustry = typeof b.projectIndustry === "string" ? b.projectIndustry.trim() : "";
    const projectDescription = typeof b.projectDescription === "string" ? b.projectDescription.trim() : "";
    const targetInvestor = typeof b.targetInvestor === "string" ? b.targetInvestor.trim() : "Pre-seed / Seed VC";
    const additionalContext = typeof b.additionalContext === "string" ? b.additionalContext.trim() : "";

    const input: GenerateDeckInput = {
      projectId,
      ownerId,
      projectName,
      projectIndustry,
      projectDescription,
      targetInvestor,
      additionalContext,
    };

    const deck = await generatePitchDeck(input);
    saveDeck(deck);

    return NextResponse.json({ deck }, { status: 201 });
  } catch (error) {
    console.error("[pitch-deck] generation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate pitch deck." },
      { status: 500 },
    );
  }
}

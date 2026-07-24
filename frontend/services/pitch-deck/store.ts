/**
 * Pitch Deck Store
 *
 * In-process storage for generated PitchDeck records.
 * Server-side only. Survives the Node.js process lifetime.
 */

import type { DeckListItem, PitchDeck, SlideContent, SlideType } from "./types";
import { SLIDE_ORDER } from "./types";

const store = new Map<string, PitchDeck>();

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function saveDeck(deck: PitchDeck): PitchDeck {
  store.set(deck.id, structuredClone(deck));
  return structuredClone(deck);
}

export function getDeck(id: string): PitchDeck | null {
  const deck = store.get(id);
  return deck ? structuredClone(deck) : null;
}

export function deleteDeck(id: string): boolean {
  return store.delete(id);
}

export function updateSlide(
  deckId: string,
  slideType: SlideType,
  patch: Partial<SlideContent>,
): PitchDeck | null {
  const deck = store.get(deckId);
  if (!deck) return null;

  const updated: PitchDeck = {
    ...deck,
    updatedAt: new Date().toISOString(),
    slides: {
      ...deck.slides,
      [slideType]: { ...deck.slides[slideType], ...patch },
    },
  };
  store.set(deckId, updated);
  return structuredClone(updated);
}

export function updateDeckMeta(
  deckId: string,
  patch: Partial<Pick<PitchDeck, "title" | "oneLiner" | "targetInvestor">>,
): PitchDeck | null {
  const deck = store.get(deckId);
  if (!deck) return null;
  const updated: PitchDeck = { ...deck, ...patch, updatedAt: new Date().toISOString() };
  store.set(deckId, updated);
  return structuredClone(updated);
}

export function listDecks(projectId: string): DeckListItem[] {
  return Array.from(store.values())
    .filter((d) => d.projectId === projectId)
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    .map(toListItem);
}

export function listAllDecks(): DeckListItem[] {
  return Array.from(store.values())
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    .map(toListItem);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toListItem(deck: PitchDeck): DeckListItem {
  return {
    id: deck.id,
    projectId: deck.projectId,
    title: deck.title,
    oneLiner: deck.oneLiner,
    targetInvestor: deck.targetInvestor,
    generatedAt: deck.generatedAt,
    updatedAt: deck.updatedAt,
    slideCount: SLIDE_ORDER.length,
  };
}

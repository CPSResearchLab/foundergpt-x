/**
 * Embeddings
 *
 * Generates float vector embeddings for document chunks.
 * Provider-agnostic: tries OpenAI-compatible embedding endpoints in order.
 *
 * Primary:   OpenRouter  (text-embedding-3-small via openai SDK)
 * Fallback:  TF-IDF sparse vector (deterministic, no API key needed)
 *
 * The fallback ensures the system works even with no embedding API key.
 * Cosine similarity works correctly on both dense and sparse vectors.
 */

import type { DocumentChunk } from "./types";

const EMBEDDING_MODEL = "openai/text-embedding-3-small";
const EMBEDDING_DIM = 1536;

// ─── Public API ───────────────────────────────────────────────────────────────

/** Attach embeddings to a batch of chunks in-place. Returns the same array. */
export async function embedChunks(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
  if (chunks.length === 0) return chunks;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (apiKey) {
    try {
      return await embedWithOpenRouter(chunks, apiKey);
    } catch (err) {
      console.warn("[embeddings] OpenRouter embedding failed, using TF-IDF fallback:", err);
    }
  }

  // Fallback: deterministic TF-IDF sparse vectors
  return embedWithTfIdf(chunks);
}

/** Compute cosine similarity between two equal-length vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Generate an embedding for a single query string (for search). */
export async function embedQuery(query: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (apiKey) {
    try {
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
      });
      const res = await client.embeddings.create({ model: EMBEDDING_MODEL, input: query });
      return res.data[0]?.embedding ?? tfidfVector(query);
    } catch {
      // fall through
    }
  }
  return tfidfVector(query);
}

// ─── OpenRouter embedding ─────────────────────────────────────────────────────

async function embedWithOpenRouter(chunks: DocumentChunk[], apiKey: string): Promise<DocumentChunk[]> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });

  // Batch in groups of 96 (API limit)
  const BATCH = 96;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const res = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch.map((c) => c.text),
    });
    for (let j = 0; j < batch.length; j++) {
      batch[j].embedding = res.data[j]?.embedding ?? [];
    }
  }
  return chunks;
}

// ─── TF-IDF fallback ──────────────────────────────────────────────────────────

function embedWithTfIdf(chunks: DocumentChunk[]): DocumentChunk[] {
  for (const chunk of chunks) {
    chunk.embedding = tfidfVector(chunk.text);
  }
  return chunks;
}

/**
 * Deterministic sparse vector of length EMBEDDING_DIM.
 * Each token hashes to a bucket; value is normalised term frequency.
 */
function tfidfVector(text: string): number[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);

  const vec = new Float32Array(EMBEDDING_DIM);
  for (const token of tokens) {
    const idx = hashToken(token) % EMBEDDING_DIM;
    vec[idx] += 1;
  }

  // L2 normalise
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < vec.length; i++) vec[i] /= norm;

  return Array.from(vec);
}

function hashToken(token: string): number {
  let h = 5381;
  for (let i = 0; i < token.length; i++) {
    h = ((h << 5) + h) ^ token.charCodeAt(i);
    h = h >>> 0; // keep unsigned 32-bit
  }
  return h;
}

import type { Source } from "./types";

export class SourceManager {
  private sources: Map<string, Source> = new Map();

  async addSource(source: Omit<Source, "id">): Promise<Source> {
    const id = this.generateId();
    const newSource: Source = { ...source, id };
    
    // Deduplication check
    const existing = Array.from(this.sources.values()).find(s => s.url === newSource.url || s.title.toLowerCase() === newSource.title.toLowerCase());
    
    if (existing) {
      // Merge confidence or content if needed
      existing.confidence = Math.max(existing.confidence, newSource.confidence);
      if (newSource.content && !existing.content) {
        existing.content = newSource.content;
      }
      return existing;
    }

    this.sources.set(id, newSource);
    return newSource;
  }

  async getSource(id: string): Promise<Source | undefined> {
    return this.sources.get(id);
  }

  async getAllSources(): Promise<Source[]> {
    return Array.from(this.sources.values());
  }

  private generateId(): string {
    return `src_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

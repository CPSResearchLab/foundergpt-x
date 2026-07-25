import type { AgentMemorySnapshot } from "./orchestration-types";

export class AgentWorkspaceManager {
  private readonly workspaces = new Map<string, {
    id: string;
    executionId: string;
    notes: Map<string, string>;
    intermediateOutputs: Map<string, string>;
    temporaryFiles: Set<string>;
    references: Set<string>;
  }>();

  create(executionId: string): string {
    const id = `workspace_${executionId}`;
    this.workspaces.set(id, { id, executionId, notes: new Map(), intermediateOutputs: new Map(), temporaryFiles: new Set(), references: new Set() });
    return id;
  }
  note(workspaceId: string, key: string, value: string): void { this.workspaces.get(workspaceId)?.notes.set(key, value); }
  output(workspaceId: string, key: string, value: string): void { this.workspaces.get(workspaceId)?.intermediateOutputs.set(key, value); }
  addFile(workspaceId: string, path: string): void { this.workspaces.get(workspaceId)?.temporaryFiles.add(path); }
  addReference(workspaceId: string, reference: string): void { this.workspaces.get(workspaceId)?.references.add(reference); }
  snapshot(workspaceId: string): AgentWorkspaceSnapshot | null {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return null;
    return { id: workspace.id, executionId: workspace.executionId, notes: Object.fromEntries(workspace.notes), intermediateOutputs: Object.fromEntries(workspace.intermediateOutputs), temporaryFiles: [...workspace.temporaryFiles], references: [...workspace.references] };
  }
  memorySnapshot(workspaceId: string): AgentMemorySnapshot | null {
    const workspace = this.snapshot(workspaceId); if (!workspace) return null;
    return { working: workspace.notes, recent: Object.values(workspace.intermediateOutputs).slice(-10), shared: workspace.references };
  }
}

export interface AgentWorkspaceSnapshot {
  id: string;
  executionId: string;
  notes: Readonly<Record<string, string>>;
  intermediateOutputs: Readonly<Record<string, string>>;
  temporaryFiles: readonly string[];
  references: readonly string[];
}

import {
  deleteMemory,
  getMemory,
  saveMemory,
  searchMemory,
  updateMemory,
  type MemoryUpdate,
} from "./memory";
import type { ProjectMemory } from "./types";

const PROJECT_COLLECTION = "projects";

export const saveProjectMemory = (project: ProjectMemory): Promise<ProjectMemory> =>
  saveMemory(PROJECT_COLLECTION, project);

export const getProjectMemory = (projectId: string): Promise<ProjectMemory | null> =>
  getMemory<ProjectMemory>(PROJECT_COLLECTION, projectId);

export const updateProjectMemory = (
  projectId: string,
  update: MemoryUpdate<ProjectMemory>,
): Promise<ProjectMemory | null> => updateMemory<ProjectMemory>(PROJECT_COLLECTION, projectId, update);

export const deleteProjectMemory = (projectId: string): Promise<boolean> =>
  deleteMemory(PROJECT_COLLECTION, projectId);

export const searchProjectMemory = (query: string, ownerId?: string): Promise<ProjectMemory[]> =>
  searchMemory<ProjectMemory>(PROJECT_COLLECTION, {
    text: query,
    predicate: (project) => !ownerId || project.ownerId === ownerId,
  });

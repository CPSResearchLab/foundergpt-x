import { saveMemory, getMemory, updateMemory, deleteMemory, searchMemory, type MemoryUpdate } from "./memory";
import type { CompanyMemory } from "./types";

const COLLECTION = "companies";

export const saveCompanyMemory = (company: CompanyMemory): Promise<CompanyMemory> =>
  saveMemory(COLLECTION, company);

export const getCompanyMemory = (id: string): Promise<CompanyMemory | null> =>
  getMemory<CompanyMemory>(COLLECTION, id);

export const updateCompanyMemory = (id: string, update: MemoryUpdate<CompanyMemory>): Promise<CompanyMemory | null> =>
  updateMemory<CompanyMemory>(COLLECTION, id, update);

export const deleteCompanyMemory = (id: string): Promise<boolean> =>
  deleteMemory(COLLECTION, id);

export const searchCompanyMemory = (query: string, projectId?: string): Promise<CompanyMemory[]> =>
  searchMemory<CompanyMemory>(COLLECTION, {
    text: query,
    predicate: (c) => !projectId || c.projectId === projectId,
  });

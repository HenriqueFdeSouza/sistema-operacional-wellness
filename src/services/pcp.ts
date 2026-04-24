import { storage, newId, nowIso, type BaseEntity } from "./storage";

export const PCP_KEY = "wellness_pcp";

export interface PCP extends BaseEntity {
  data: string;
  nome: string;
  produto: string;
}

export const pcpService = {
  list(): PCP[] {
    return storage.getAll<PCP>(PCP_KEY);
  },
  create(input: { nome: string; produto: string; data?: string }): PCP {
    const item: PCP = {
      id: newId(),
      data: input.data ?? nowIso(),
      nome: input.nome,
      produto: input.produto,
    };
    return storage.addItem<PCP>(PCP_KEY, item);
  },
  update(id: string, updates: Partial<PCP>): PCP | null {
    return storage.updateItem<PCP>(PCP_KEY, id, updates);
  },
  remove(id: string): boolean {
    return storage.deleteItem<PCP>(PCP_KEY, id);
  },
};
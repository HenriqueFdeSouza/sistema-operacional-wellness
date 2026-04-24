import { storage, newId, type BaseEntity } from "./storage";

export const ARMARIOS_MASC_KEY = "wellness_armarios_masculinos";
export const ARMARIOS_FEM_KEY = "wellness_armarios_femininos";

export const TIPOS_CADEADO = [
  "CADEADO DA SEGURANÇA",
  "CADEADO DO COLABORADOR",
  "QUEBRA DE CADEADO",
  "VAGO",
] as const;

export type TipoCadeado = (typeof TIPOS_CADEADO)[number];

export interface Armario extends BaseEntity {
  numero: number;
  nome_colaborador: string;
  matricula: string;
  setor: string;
  cadeado: TipoCadeado;
  observacao: string;
}

function makeService(key: string) {
  return {
    list(): Armario[] {
      return storage
        .getAll<Armario>(key)
        .slice()
        .sort((a, b) => a.numero - b.numero);
    },
    upsertByNumero(numero: number, input: Omit<Armario, "id" | "numero">): Armario {
      const all = storage.getAll<Armario>(key);
      const existing = all.find((a) => a.numero === numero);
      if (existing) {
        return storage.updateItem<Armario>(key, existing.id, input) ?? existing;
      }
      return storage.addItem<Armario>(key, { ...input, numero, id: newId() });
    },
    update(id: string, updates: Partial<Armario>): Armario | null {
      return storage.updateItem<Armario>(key, id, updates);
    },
    remove(id: string): boolean {
      return storage.deleteItem<Armario>(key, id);
    },
  };
}

export const armariosMascService = makeService(ARMARIOS_MASC_KEY);
export const armariosFemService = makeService(ARMARIOS_FEM_KEY);
import { storage, newId, nowIso, type BaseEntity } from "./storage";

export const MESTRAS_MANUT_KEY = "wellness_mestras_manutencao";
export const MESTRAS_RECEP_KEY = "wellness_mestras_recepcao";

export const SETORES_MANUT = ["MAN.", "CORPORATIVO"] as const;
export const SETORES_RECEP = ["RECEPÇÃO", "MENSAGEIRO"] as const;

export type SetorMestraManut = (typeof SETORES_MANUT)[number];
export type SetorMestraRecep = (typeof SETORES_RECEP)[number];

export interface Mestra extends BaseEntity {
  data: string;
  colaborador: string;
  setor: string;
  horario_saida: string;
  agente_saida: string;
  horario_retorno: string | null;
  agente_retorno: string | null;
}

function makeService(key: string) {
  return {
    list(): Mestra[] {
      return storage.getAll<Mestra>(key);
    },
    create(input: {
      colaborador: string;
      setor: string;
      horario_saida: string;
      agente_saida: string;
    }): Mestra {
      const item: Mestra = {
        ...input,
        id: newId(),
        data: nowIso(),
        horario_retorno: null,
        agente_retorno: null,
      };
      return storage.addItem<Mestra>(key, item);
    },
    registrarRetorno(
      id: string,
      input: { agente_retorno: string; horario_retorno?: string },
    ): Mestra | null {
      return storage.updateItem<Mestra>(key, id, {
        agente_retorno: input.agente_retorno,
        horario_retorno: input.horario_retorno ?? nowIso(),
      });
    },
    update(id: string, updates: Partial<Mestra>): Mestra | null {
      return storage.updateItem<Mestra>(key, id, updates);
    },
    remove(id: string): boolean {
      return storage.deleteItem<Mestra>(key, id);
    },
  };
}

export const mestrasManutService = makeService(MESTRAS_MANUT_KEY);
export const mestrasRecepService = makeService(MESTRAS_RECEP_KEY);
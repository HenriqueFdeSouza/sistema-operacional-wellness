import { storage, newId, nowIso, type BaseEntity } from "./storage";

export const CHAVES_KEY = "wellness_chaves";

export interface Chave extends BaseEntity {
  data: string;
  chave: string;
  colaborador_saida: string;
  setor_saida: string;
  horario_saida: string;
  agente_saida: string;
  colaborador_retorno: string | null;
  setor_retorno: string | null;
  horario_retorno: string | null;
  agente_retorno: string | null;
}

export const chavesService = {
  list(): Chave[] {
    return storage.getAll<Chave>(CHAVES_KEY);
  },
  create(input: {
    chave: string;
    colaborador_saida: string;
    setor_saida: string;
    horario_saida: string;
    agente_saida: string;
  }): Chave {
    const item: Chave = {
      ...input,
      id: newId(),
      data: nowIso(),
      colaborador_retorno: null,
      setor_retorno: null,
      horario_retorno: null,
      agente_retorno: null,
    };
    return storage.addItem<Chave>(CHAVES_KEY, item);
  },
  registrarRetorno(
    id: string,
    input: {
      colaborador_retorno: string;
      setor_retorno: string;
      agente_retorno: string;
      horario_retorno?: string;
    },
  ): Chave | null {
    return storage.updateItem<Chave>(CHAVES_KEY, id, {
      ...input,
      horario_retorno: input.horario_retorno ?? nowIso(),
    });
  },
  update(id: string, updates: Partial<Chave>): Chave | null {
    return storage.updateItem<Chave>(CHAVES_KEY, id, updates);
  },
  remove(id: string): boolean {
    return storage.deleteItem<Chave>(CHAVES_KEY, id);
  },
};
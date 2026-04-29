import { storage, newId, nowIso, type BaseEntity } from "./storage";

export const RADIOS_KEY = "wellness_radios";

export const SETORES_RADIO = [
  "A&B",
  "E&L",
  "Governança",
  "Manutenção",
  "Piscina",
  "Recepção",
  "Segurança",
  "Viper",
] as const;

export const ALTERACOES_RADIO = ["RADIO", "COMPLETO", "RADIO E CAPA"] as const;

export type SetorRadio = (typeof SETORES_RADIO)[number];
export type AlteracaoRadio = (typeof ALTERACOES_RADIO)[number];

export interface Radio extends BaseEntity {
  colaborador: string;
  id_radio: string;
  setor: SetorRadio;
  saida: string;
  retorno: string | null;
  alteracao: AlteracaoRadio;
  data_registro: string;
}

export const radiosService = {
  list(): Radio[] {
    return storage.getAll<Radio>(RADIOS_KEY);
  },
  create(input: Omit<Radio, "id" | "data_registro" | "retorno">): Radio {
    const item: Radio = {
      ...input,
      id: newId(),
      retorno: null,
      data_registro: nowIso(),
    };
    return storage.addItem<Radio>(RADIOS_KEY, item);
  },
  registrarRetorno(id: string, retorno: string = nowIso()): Radio | null {
    return storage.updateItem<Radio>(RADIOS_KEY, id, { retorno });
  },
  update(id: string, updates: Partial<Radio>): Radio | null {
    return storage.updateItem<Radio>(RADIOS_KEY, id, updates);
  },
  remove(id: string): boolean {
    return storage.deleteItem<Radio>(RADIOS_KEY, id);
  },
};
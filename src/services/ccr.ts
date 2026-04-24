import { storage, newId, nowIso, type BaseEntity } from "./storage";

export const CCR_KEY = "wellness_ccr";

export const TURNOS_CCR = ["DIURNO", "NOTURNO"] as const;
export const POSTOS_CCR = [
  "RONDANTE",
  "PORTARIA SOCIAL",
  "PORTARIA PRAIA",
  "PORTARIA SERVIÇO",
  "VIGILANTE",
] as const;
export const STATUS_ITEM = ["OK", "NSA", "NOK"] as const;

export type TurnoCCR = (typeof TURNOS_CCR)[number];
export type PostoCCR = (typeof POSTOS_CCR)[number];
export type StatusItem = (typeof STATUS_ITEM)[number];

export interface CCR extends BaseEntity {
  data: string;
  turno: TurnoCCR;
  horario: string;
  agente: string;
  posto: PostoCCR;
  controle_acesso: StatusItem;
  cameras: StatusItem;
  radios: StatusItem;
  cancelas: StatusItem;
  alarme: StatusItem;
  acao_corretiva: string;
  status: string;
}

export const ccrService = {
  list(): CCR[] {
    return storage.getAll<CCR>(CCR_KEY);
  },
  create(input: Omit<CCR, "id" | "data">): CCR {
    const item: CCR = { ...input, id: newId(), data: nowIso() };
    return storage.addItem<CCR>(CCR_KEY, item);
  },
  update(id: string, updates: Partial<CCR>): CCR | null {
    return storage.updateItem<CCR>(CCR_KEY, id, updates);
  },
  remove(id: string): boolean {
    return storage.deleteItem<CCR>(CCR_KEY, id);
  },
};
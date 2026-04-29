import { storage, newId, type BaseEntity } from "./storage";

export const VEICULOS_KEY = "wellness_veiculos";

export const OBSERVACOES_VEICULO = [
  "PROPRIETÁRIO",
  "PRESTADOR DE SERVIÇO",
  "GESTOR",
  "VISITANTE",
] as const;

export type ObservacaoVeiculo = (typeof OBSERVACOES_VEICULO)[number] | string;

export interface Veiculo extends BaseEntity {
  uh: string;
  nome: string;
  carro: string;
  cor: string;
  placa: string;
  observacoes: ObservacaoVeiculo;
  autorizacoes: string;
}

export const veiculosService = {
  list(): Veiculo[] {
    return storage.getAll<Veiculo>(VEICULOS_KEY);
  },
  create(input: Omit<Veiculo, "id">): Veiculo {
    const item: Veiculo = { ...input, id: newId() };
    return storage.addItem<Veiculo>(VEICULOS_KEY, item);
  },
  update(id: string, updates: Partial<Veiculo>): Veiculo | null {
    return storage.updateItem<Veiculo>(VEICULOS_KEY, id, updates);
  },
  remove(id: string): boolean {
    return storage.deleteItem<Veiculo>(VEICULOS_KEY, id);
  },
};
import { supabase } from "@/lib/supabase";

export const OBSERVACOES_VEICULO = [
  "PROPRIETÁRIO",
  "PRESTADOR DE SERVIÇO",
  "GESTOR",
  "VISITANTE",
] as const;

export type ObservacaoVeiculo = (typeof OBSERVACOES_VEICULO)[number] | string;

export interface Veiculo {
  id: string;
  uh: string;
  nome: string;
  carro: string;
  cor: string;
  placa: string;
  observacoes: ObservacaoVeiculo;
  autorizacoes: string;
  created_at?: string | null;
}

export interface NovoVeiculoInput {
  uh: string;
  nome: string;
  carro: string;
  cor: string;
  placa: string;
  observacoes: ObservacaoVeiculo;
  autorizacoes: string;
}

const TABLE = "veiculos";

function mapFromDb(row: any): Veiculo {
  return {
    id: row.id,
    uh: row.uh ?? "",
    nome: row.nome,
    carro: row.carro ?? "",
    cor: row.cor ?? "",
    placa: row.placa,
    observacoes: row.observacoes,
    autorizacoes: row.autorizacoes ?? "",
    created_at: row.created_at,
  };
}

export const veiculosService = {
  async list(): Promise<Veiculo[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao listar veículos:", error);
      throw error;
    }

    return (data ?? []).map(mapFromDb);
  },

  async create(input: NovoVeiculoInput): Promise<Veiculo> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        uh: input.uh,
        nome: input.nome,
        carro: input.carro,
        cor: input.cor,
        placa: input.placa,
        observacoes: input.observacoes,
        autorizacoes: input.autorizacoes,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao criar veículo:", error);
      throw error;
    }

    return mapFromDb(data);
  },

  async update(id: string, updates: Partial<Veiculo>): Promise<Veiculo | null> {
    const payload = {
      uh: updates.uh,
      nome: updates.nome,
      carro: updates.carro,
      cor: updates.cor,
      placa: updates.placa,
      observacoes: updates.observacoes,
      autorizacoes: updates.autorizacoes,
    };

    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao atualizar veículo:", error);
      throw error;
    }

    return data ? mapFromDb(data) : null;
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir veículo:", error);
      throw error;
    }

    return true;
  },
};

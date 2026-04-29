import { supabase } from "@/lib/supabase";

export interface Chave {
  id: string;
  chave: string;
  horario_saida: string;
  colaborador_saida: string;
  setor_saida: string;
  agente_saida: string;
  colaborador_retorno?: string | null;
  setor_retorno?: string | null;
  agente_retorno?: string | null;
  horario_retorno?: string | null;
  created_at?: string | null;
}

export interface NovaChaveInput {
  chave: string;
  horario_saida: string;
  colaborador_saida: string;
  setor_saida: string;
  agente_saida: string;
}

export interface RetornoChaveInput {
  colaborador_retorno: string;
  setor_retorno: string;
  agente_retorno: string;
  horario_retorno: string;
}

const TABLE = "chaves";

function mapFromDb(row: any): Chave {
  return {
    id: row.id,
    chave: row.chave,
    horario_saida: row.horario_saida,
    colaborador_saida: row.colaborador_saida,
    setor_saida: row.setor_saida ?? row.setor ?? "",
    agente_saida: row.agente_saida,
    colaborador_retorno: row.colaborador_retorno,
    setor_retorno: row.setor_retorno,
    agente_retorno: row.agente_retorno,
    horario_retorno: row.horario_retorno,
    created_at: row.created_at,
  };
}

export const chavesService = {
  async list(): Promise<Chave[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("horario_saida", { ascending: false });

    if (error) {
      console.error("Erro ao listar chaves:", error);
      throw error;
    }

    return (data ?? []).map(mapFromDb);
  },

  async create(input: NovaChaveInput): Promise<Chave> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
  chave: input.chave,
  horario_saida: input.horario_saida,
  colaborador_saida: input.colaborador_saida,
  setor: input.setor_saida,
  setor_saida: input.setor_saida,
  agente_saida: input.agente_saida,
})
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao criar saída de chave:", error);
      throw error;
    }

    return mapFromDb(data);
  },

  async registrarRetorno(id: string, input: RetornoChaveInput): Promise<Chave | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        colaborador_retorno: input.colaborador_retorno,
        setor_retorno: input.setor_retorno,
        agente_retorno: input.agente_retorno,
        horario_retorno: input.horario_retorno,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao registrar retorno de chave:", error);
      throw error;
    }

    return data ? mapFromDb(data) : null;
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir chave:", error);
      throw error;
    }

    return true;
  },
};

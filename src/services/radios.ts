import { supabase } from "@/lib/supabase";

export const SETORES_RADIO = [
  "A&B",
  "Cozinha",
  "Desenvolvimento",
  "E&L",
  "Governança",
  "Hotelaria",
  "Manutenção",
  "Piscina",
  "Recepção",
  "Segurança",
  "SPA",
  "Viper",
] as const;

export const ALTERACOES_RADIO = ["RADIO", "COMPLETO", "RADIO E CAPA"] as const;

export type SetorRadio = (typeof SETORES_RADIO)[number];
export type AlteracaoRadio = (typeof ALTERACOES_RADIO)[number];

export interface Radio {
  id: string;
  colaborador: string;
  id_radio: string;
  setor: string;
  saida: string;
  retorno: string | null;
  alteracao: string;
  data_registro?: string | null;
  created_at?: string | null;
}

export interface NovaEntregaRadioInput {
  colaborador: string;
  id_radio: string;
  setor: string;
  alteracao: string;
  saida: string;
}

const TABLE = "radios";

function mapFromDb(row: any): Radio {
  return {
    id: row.id,
    colaborador: row.colaborador,
    id_radio: row.id_radio,
    setor: row.setor,
    saida: row.saida,
    retorno: row.retorno,
    alteracao: row.alteracao,
    data_registro: row.data_registro ?? row.created_at,
    created_at: row.created_at,
  };
}

export const radiosService = {
  async list(): Promise<Radio[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("saida", { ascending: false });

    if (error) {
      console.error("Erro ao listar rádios:", error);
      throw error;
    }

    return (data ?? []).map(mapFromDb);
  },

  async create(input: NovaEntregaRadioInput): Promise<Radio> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        colaborador: input.colaborador,
        id_radio: input.id_radio,
        setor: input.setor,
        alteracao: input.alteracao,
        saida: input.saida,
        data_registro: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao criar entrega de rádio:", error);
      throw error;
    }

    return mapFromDb(data);
  },

  async registrarRetorno(id: string, retorno: string = new Date().toISOString()): Promise<Radio | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ retorno })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao registrar retorno de rádio:", error);
      throw error;
    }

    return data ? mapFromDb(data) : null;
  },

  async update(id: string, updates: Partial<Radio>): Promise<Radio | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao atualizar rádio:", error);
      throw error;
    }

    return data ? mapFromDb(data) : null;
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir rádio:", error);
      throw error;
    }

    return true;
  },
};

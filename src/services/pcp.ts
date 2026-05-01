import { supabase } from "@/lib/supabase";

export interface PCP {
  id: string;
  data: string;
  nome: string;
  produto: string;
  created_at?: string | null;
}

export interface NovoPCPInput {
  nome: string;
  produto: string;
  data?: string;
}

const TABLE = "pcp";

function mapFromDb(row: any): PCP {
  return {
    id: row.id,
    data: row.data,
    nome: row.nome,
    produto: row.produto,
    created_at: row.created_at,
  };
}

export const pcpService = {
  async list(): Promise<PCP[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("data", { ascending: false });

    if (error) {
      console.error("Erro ao listar PCP:", error);
      throw error;
    }

    return (data ?? []).map(mapFromDb);
  },

  async create(input: NovoPCPInput): Promise<PCP> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        nome: input.nome,
        produto: input.produto,
        data: input.data ?? new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao criar retirada PCP:", error);
      throw error;
    }

    return mapFromDb(data);
  },

  async update(id: string, updates: Partial<PCP>): Promise<PCP | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao atualizar PCP:", error);
      throw error;
    }

    return data ? mapFromDb(data) : null;
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir PCP:", error);
      throw error;
    }

    return true;
  },
};

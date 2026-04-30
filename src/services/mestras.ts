import { supabase } from "@/lib/supabase";

export const SETORES_MANUT = ["MAN."] as const;
export const SETORES_RECEP = ["RECEPÇÃO", "MENSAGEIRO"] as const;

export type SetorManut = (typeof SETORES_MANUT)[number];
export type SetorRecep = (typeof SETORES_RECEP)[number];

export interface Mestra {
  id: string;
  colaborador: string;
  setor: string;
  horario_saida: string;
  agente_saida: string;
  agente_retorno?: string | null;
  horario_retorno?: string | null;
  created_at?: string | null;
}

export interface NovaMestraInput {
  colaborador: string;
  setor: string;
  horario_saida: string;
  agente_saida: string;
}

export interface RetornoMestraInput {
  agente_retorno: string;
  horario_retorno?: string;
}

function mapFromDb(row: any): Mestra {
  return {
    id: row.id,
    colaborador: row.colaborador,
    setor: row.setor,
    horario_saida: row.horario_saida,
    agente_saida: row.agente_saida,
    agente_retorno: row.agente_retorno,
    horario_retorno: row.horario_retorno,
    created_at: row.created_at,
  };
}

function makeService(table: string) {
  return {
    async list(): Promise<Mestra[]> {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("horario_saida", { ascending: false });

      if (error) {
        console.error(`Erro ao listar ${table}:`, error);
        throw error;
      }

      return (data ?? []).map(mapFromDb);
    },

    async create(input: NovaMestraInput): Promise<Mestra> {
      const { data, error } = await supabase
        .from(table)
        .insert({
          colaborador: input.colaborador,
          setor: input.setor,
          horario_saida: input.horario_saida,
          agente_saida: input.agente_saida,
        })
        .select("*")
        .single();

      if (error) {
        console.error(`Erro ao criar registro em ${table}:`, error);
        throw error;
      }

      return mapFromDb(data);
    },

    async registrarRetorno(id: string, input: RetornoMestraInput): Promise<Mestra | null> {
      const { data, error } = await supabase
        .from(table)
        .update({
          agente_retorno: input.agente_retorno,
          horario_retorno: input.horario_retorno ?? new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        console.error(`Erro ao registrar retorno em ${table}:`, error);
        throw error;
      }

      return data ? mapFromDb(data) : null;
    },

    async remove(id: string): Promise<boolean> {
      const { error } = await supabase.from(table).delete().eq("id", id);

      if (error) {
        console.error(`Erro ao excluir registro em ${table}:`, error);
        throw error;
      }

      return true;
    },
  };
}

export const mestrasManutService = makeService("mestras_manutencao");
export const mestrasRecepService = makeService("mestras_recepcao");

import { supabase } from "@/lib/supabase";

export const STATUS_ITEM_SEGURANCA = ["OK", "P", "A", "NSA", "NOK"] as const;
export type StatusItemSeguranca = (typeof STATUS_ITEM_SEGURANCA)[number];
export type TurnoSeguranca = "DIURNO" | "NOTURNO";

export interface ChecklistSeguranca {
  id: string;
  data: string;
  turno: TurnoSeguranca;
  horario: string;
  agente: string;
  posto: string;
  cinco_s_postos: StatusItemSeguranca;
  camera: StatusItemSeguranca;
  radios: StatusItemSeguranca;
  cancelas: StatusItemSeguranca;
  alarme: StatusItemSeguranca;
  acao_corretiva: string;
  status: StatusItemSeguranca;
  created_at?: string | null;
}

export interface NovoChecklistSegurancaInput {
  data?: string;
  turno: TurnoSeguranca;
  horario: string;
  agente: string;
  posto: string;
  cinco_s_postos: StatusItemSeguranca;
  camera: StatusItemSeguranca;
  radios: StatusItemSeguranca;
  cancelas: StatusItemSeguranca;
  alarme: StatusItemSeguranca;
  acao_corretiva: string;
  status: StatusItemSeguranca;
}

const TABLE = "checklist_seguranca_operacional";

function mapFromDb(row: any): ChecklistSeguranca {
  return {
    id: row.id,
    data: row.data,
    turno: row.turno,
    horario: row.horario,
    agente: row.agente,
    posto: row.posto,
    cinco_s_postos: row.cinco_s_postos,
    camera: row.camera,
    radios: row.radios,
    cancelas: row.cancelas,
    alarme: row.alarme,
    acao_corretiva: row.acao_corretiva ?? "",
    status: row.status,
    created_at: row.created_at,
  };
}

export const checklistSegurancaService = {
  async list(): Promise<ChecklistSeguranca[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("data", { ascending: false })
      .order("turno", { ascending: true })
      .order("horario", { ascending: true });

    if (error) {
      console.error("Erro ao listar checklist de segurança:", error);
      throw error;
    }

    return (data ?? []).map(mapFromDb);
  },

  async create(input: NovoChecklistSegurancaInput): Promise<ChecklistSeguranca> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        data: input.data ?? new Date().toISOString(),
        turno: input.turno,
        horario: input.horario,
        agente: input.agente,
        posto: input.posto,
        cinco_s_postos: input.cinco_s_postos,
        camera: input.camera,
        radios: input.radios,
        cancelas: input.cancelas,
        alarme: input.alarme,
        acao_corretiva: input.acao_corretiva,
        status: input.status,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao criar checklist de segurança:", error);
      throw error;
    }

    return mapFromDb(data);
  },

  async update(
    id: string,
    updates: Partial<Omit<ChecklistSeguranca, "id" | "created_at">>,
  ): Promise<ChecklistSeguranca> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao atualizar checklist de segurança:", error);
      throw error;
    }

    return mapFromDb(data);
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir checklist de segurança:", error);
      throw error;
    }

    return true;
  },
};

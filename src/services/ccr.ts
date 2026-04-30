import { supabase } from "@/lib/supabase";

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

export interface AgenteCCR {
  nome: string;
  posto: PostoCCR;
}

export interface CCR {
  id: string;
  data: string;
  turno: TurnoCCR;
  horario: string;
  agentes: AgenteCCR[];
  agente?: string | null;
  posto?: PostoCCR | null;
  controle_acesso: StatusItem;
  cameras: StatusItem;
  radios: StatusItem;
  cancelas: StatusItem;
  alarme: StatusItem;
  acao_corretiva?: string | null;
  status?: string | null;
  created_at?: string | null;
}

export interface NovoCCRInput {
  turno: TurnoCCR;
  horario: string;
  agentes: AgenteCCR[];
  controle_acesso: StatusItem;
  cameras: StatusItem;
  radios: StatusItem;
  cancelas: StatusItem;
  alarme: StatusItem;
  acao_corretiva?: string;
  status?: string;
}

const TABLE = "ccr";

function normalizeAgentes(row: any): AgenteCCR[] {
  if (Array.isArray(row.agentes)) {
    return row.agentes;
  }

  if (row.agente && row.posto) {
    return [
      {
        nome: row.agente,
        posto: row.posto,
      },
    ];
  }

  return [];
}

function mapFromDb(row: any): CCR {
  return {
    id: row.id,
    data: row.data,
    turno: row.turno,
    horario: row.horario,
    agentes: normalizeAgentes(row),
    agente: row.agente,
    posto: row.posto,
    controle_acesso: row.controle_acesso,
    cameras: row.cameras,
    radios: row.radios,
    cancelas: row.cancelas,
    alarme: row.alarme,
    acao_corretiva: row.acao_corretiva,
    status: row.status,
    created_at: row.created_at,
  };
}

export const ccrService = {
  async list(): Promise<CCR[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao listar CCR:", error);
      throw error;
    }

    return (data ?? []).map(mapFromDb);
  },

  async create(input: NovoCCRInput): Promise<CCR> {
    const primeiroAgente = input.agentes[0];

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        data: new Date().toISOString(),
        turno: input.turno,
        horario: input.horario,
        agentes: input.agentes,
        agente: primeiroAgente?.nome ?? null,
        posto: primeiroAgente?.posto ?? null,
        controle_acesso: input.controle_acesso,
        cameras: input.cameras,
        radios: input.radios,
        cancelas: input.cancelas,
        alarme: input.alarme,
        acao_corretiva: input.acao_corretiva ?? "",
        status: input.status ?? "",
      })
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao criar checklist CCR:", error);
      throw error;
    }

    return mapFromDb(data);
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir CCR:", error);
      throw error;
    }

    return true;
  },
};

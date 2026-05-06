import { supabase } from "@/lib/supabase";

export type TurnoResumo = "DIURNO" | "NOTURNO";

export interface PeriodoPlantao {
  data: string;
  turno: "DIA COMPLETO";
  inicioIso: string;
  fimIso: string;
  horario: string;
}

export interface RadioResumo {
  id: string;
  colaborador: string;
  id_radio: string;
  setor: string;
  alteracao: string;
  saida: string;
  retorno: string | null;
}

export interface ChaveResumo {
  id: string;
  chave: string;
  colaborador: string;
  setor: string;
  agente_entregou: string;
  saida: string;
  retorno: string | null;
  agente_recebeu: string;
}

export interface MestraResumo {
  id: string;
  colaborador: string;
  setor: string;
  agente_entregou: string;
  saida: string;
  retorno: string | null;
  agente_recebeu: string;
  origem: "Manutenção" | "Recepção";
}

export interface PcpResumo {
  id: string;
  nome: string;
  produto: string;
  created_at: string | null;
}

export interface VeiculoResumo {
  id: string;
  uh: string;
  nome: string;
  placa: string;
  tipo: string;
  created_at: string | null;
}

export interface ArmarioResumo {
  id: string;
  numero: number;
  genero: string;
  nome_colaborador: string;
  setor: string;
  termo: string;
  created_at: string | null;
}

export interface ChecklistResumo {
  id: string;
  turno: string;
  horario: string;
  agente: string;
  posto: string;
  cinco_s_postos: string;
  camera: string;
  radios: string;
  cancelas: string;
  alarme: string;
  acao_corretiva: string;
  status: string;
}

export interface CcrResumo {
  id: string;
  data: string;
  turno: string;
  horario: string;
  agentes: Array<{
    nome: string;
    posto: string;
  }>;
  controle_acesso: string;
  cameras: string;
  radios: string;
  cancelas: string;
  alarme: string;
  acao_corretiva: string;
  status: string;
}

export interface ResumoPlantao {
  periodo: PeriodoPlantao;
  radios: RadioResumo[];
  chaves: ChaveResumo[];
  mestras: MestraResumo[];
  pcp: PcpResumo[];
  veiculos: VeiculoResumo[];
  armarios: ArmarioResumo[];
  checklist: ChecklistResumo[];
  ccr: CcrResumo[];
}

function toIsoLocal(date: string, hour: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, hour, 0, 0, 0).toISOString();
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function criarPeriodoDiaCompleto(data: string) {
  return {
    inicioIso: toIsoLocal(data, 0),
    fimIso: toIsoLocal(addDays(data, 1), 0),
  };
}

export function criarPeriodoPlantao(data: string): PeriodoPlantao {
  return {
    data,
    turno: "DIA COMPLETO",
    inicioIso: toIsoLocal(data, 0),
    fimIso: toIsoLocal(addDays(data, 1), 0),
    horario: "00:00 às 23:59",
  };
}

function str(value: any) {
  return value === null || value === undefined ? "" : String(value);
}

function mapRadio(row: any): RadioResumo {
  return {
    id: str(row.id),
    colaborador: str(row.colaborador),
    id_radio: str(row.id_radio),
    setor: str(row.setor),
    alteracao: str(row.alteracao),
    saida: str(row.saida),
    retorno: row.retorno ?? null,
  };
}

function mapChave(row: any): ChaveResumo {
  return {
    id: str(row.id),
    chave: str(row.chave),
    colaborador: str(row.colaborador_saida ?? row.colaborador),
    setor: str(row.setor_saida ?? row.setor),
    agente_entregou: str(row.agente_saida),
    saida: str(row.horario_saida ?? row.saida),
    retorno: row.horario_retorno ?? row.retorno ?? null,
    agente_recebeu: str(row.agente_retorno),
  };
}

function mapMestra(row: any, origem: "Manutenção" | "Recepção"): MestraResumo {
  return {
    id: str(row.id),
    colaborador: str(row.colaborador),
    setor: str(row.setor),
    agente_entregou: str(row.agente_saida),
    saida: str(row.horario_saida),
    retorno: row.horario_retorno ?? null,
    agente_recebeu: str(row.agente_retorno),
    origem,
  };
}

function mapPcp(row: any): PcpResumo {
  return {
    id: str(row.id),
    nome: str(row.nome ?? row.colaborador),
    produto: str(row.produto ?? row.descricao ?? row.item),
    created_at: row.created_at ?? row.data ?? null,
  };
}

function mapVeiculo(row: any): VeiculoResumo {
  return {
    id: str(row.id),
    uh: str(row.uh),
    nome: str(row.nome),
    placa: str(row.placa),
    tipo: str(row.observacoes ?? row.tipo),
    created_at: row.created_at ?? null,
  };
}

function mapArmario(row: any): ArmarioResumo {
  return {
    id: str(row.id),
    numero: Number(row.numero ?? row.armario ?? 0),
    genero: str(row.genero),
    nome_colaborador: str(row.nome_colaborador ?? row.colaborador),
    setor: str(row.setor),
    termo: str(row.termo),
    created_at: row.created_at ?? null,
  };
}

function mapChecklist(row: any): ChecklistResumo {
  return {
    id: str(row.id),
    turno: str(row.turno),
    horario: str(row.horario),
    agente: str(row.agente),
    posto: str(row.posto),
    cinco_s_postos: str(row.cinco_s_postos),
    camera: str(row.camera),
    radios: str(row.radios),
    cancelas: str(row.cancelas),
    alarme: str(row.alarme),
    acao_corretiva: str(row.acao_corretiva),
    status: str(row.status),
  };
}

function parseAgentes(value: any): Array<{ nome: string; posto: string }> {
  if (Array.isArray(value)) {
    return value.map((item) => ({
      nome: str(item?.nome),
      posto: str(item?.posto),
    }));
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          nome: str(item?.nome),
          posto: str(item?.posto),
        }));
      }
    } catch {
      return [];
    }
  }

  return [];
}

function mapCcr(row: any): CcrResumo {
  const agentes = parseAgentes(row.agentes);

  return {
    id: str(row.id),
    data: str(row.data),
    turno: str(row.turno),
    horario: str(row.horario),
    agentes:
      agentes.length > 0
        ? agentes
        : [
            {
              nome: str(row.agente),
              posto: str(row.posto),
            },
          ],
    controle_acesso: str(row.controle_acesso),
    cameras: str(row.cameras),
    radios: str(row.radios),
    cancelas: str(row.cancelas),
    alarme: str(row.alarme),
    acao_corretiva: str(row.acao_corretiva),
    status: str(row.status),
  };
}

async function safeQuery<T>(
  label: string,
  query: PromiseLike<{ data: any[] | null; error: any }>,
  mapper: (row: any) => T,
): Promise<T[]> {
  const { data, error } = await query;

  if (error) {
    console.error(`Erro ao buscar ${label}:`, error);
    return [];
  }

  return (data ?? []).map(mapper);
}

export const resumoPlantaoService = {
  async getResumo(data: string): Promise<ResumoPlantao> {
    const periodo = criarPeriodoPlantao(data);

    const [
      radios,
      chaves,
      mestrasManutencao,
      mestrasRecepcao,
      pcp,
      veiculos,
      armarios,
      checklist,
      ccr,
    ] = await Promise.all([
      safeQuery(
        "rádios",
        supabase
          .from("radios")
          .select("*")
          .gte("saida", periodo.inicioIso)
          .lt("saida", periodo.fimIso)
          .order("saida", { ascending: true }),
        mapRadio,
      ),
      safeQuery(
        "chaves",
        supabase
          .from("chaves")
          .select("*")
          .gte("horario_saida", periodo.inicioIso)
          .lt("horario_saida", periodo.fimIso)
          .order("horario_saida", { ascending: true }),
        mapChave,
      ),
      safeQuery(
        "mestras manutenção",
        supabase
          .from("mestras_manutencao")
          .select("*")
          .gte("horario_saida", periodo.inicioIso)
          .lt("horario_saida", periodo.fimIso)
          .order("horario_saida", { ascending: true }),
        (row) => mapMestra(row, "Manutenção"),
      ),
      safeQuery(
        "mestras recepção",
        supabase
          .from("mestras_recepcao")
          .select("*")
          .gte("horario_saida", periodo.inicioIso)
          .lt("horario_saida", periodo.fimIso)
          .order("horario_saida", { ascending: true }),
        (row) => mapMestra(row, "Recepção"),
      ),
      safeQuery(
        "PCP",
        supabase
          .from("pcp")
          .select("*")
          .gte("created_at", periodo.inicioIso)
          .lt("created_at", periodo.fimIso)
          .order("created_at", { ascending: true }),
        mapPcp,
      ),
      safeQuery(
        "veículos",
        supabase
          .from("veiculos")
          .select("*")
          .gte("created_at", periodo.inicioIso)
          .lt("created_at", periodo.fimIso)
          .order("created_at", { ascending: true }),
        mapVeiculo,
      ),
      safeQuery(
        "armários",
        supabase
          .from("armarios")
          .select("*")
          .gte("created_at", periodo.inicioIso)
          .lt("created_at", periodo.fimIso)
          .order("created_at", { ascending: true }),
        mapArmario,
      ),
      safeQuery(
        "checklist segurança operacional",
        supabase
          .from("checklist_seguranca_operacional")
          .select("*")
          .gte("data", periodo.inicioIso)
          .lt("data", periodo.fimIso)
          .order("horario", { ascending: true }),
        mapChecklist,
      ),
      safeQuery(
        "CCR",
        supabase
          .from("ccr")
          .select("*")
          .gte("data", periodo.inicioIso)
          .lt("data", periodo.fimIso)
          .order("horario", { ascending: true }),
        mapCcr,
      ),
    ]);

    return {
      periodo,
      radios,
      chaves,
      mestras: [...mestrasManutencao, ...mestrasRecepcao],
      pcp,
      veiculos,
      armarios,
      checklist,
      ccr,
    };
  },
};

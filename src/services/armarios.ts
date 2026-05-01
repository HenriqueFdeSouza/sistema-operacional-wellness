import { supabase } from "@/lib/supabase";


export const TIPOS_TERMO = [
  "TERMO OK",
  "FALTA ASSINAR O TERMO",
] as const;


export type TipoTermo = (typeof TIPOS_TERMO)[number];
export type GeneroArmario = "MASCULINO" | "FEMININO";

export interface Armario {
  id: string;
  numero: number;
  genero: GeneroArmario;
  nome_colaborador: string;
  matricula: string;
  setor: string;
  termo: TipoTermo;
  observacao: string;
  created_at?: string | null;
}

export interface ArmarioInput {
  nome_colaborador: string;
  matricula: string;
  setor: string;
  termo: TipoTermo;
  observacao: string;
}

const TABLE = "armarios";

function mapFromDb(row: any): Armario {
  return {
    id: row.id,
    numero: Number(row.numero),
    genero: row.genero,
    nome_colaborador: row.nome_colaborador ?? "",
    matricula: row.matricula ?? "",
    setor: row.setor ?? "",
termo: row.termo ?? "FALTA ASSINAR O TERMO",
observacao: row.observacao ?? "",
    created_at: row.created_at,
  };
}

function makeService(genero: GeneroArmario) {
  return {
    async list(): Promise<Armario[]> {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("genero", genero)
        .order("numero", { ascending: true });

      if (error) {
        console.error(`Erro ao listar armários ${genero}:`, error);
        throw error;
      }

      return (data ?? []).map(mapFromDb);
    },

    async upsertByNumero(numero: number, input: ArmarioInput): Promise<Armario> {
      const { data: existing, error: findError } = await supabase
        .from(TABLE)
        .select("*")
        .eq("genero", genero)
        .eq("numero", numero)
        .maybeSingle();

      if (findError) {
        console.error(`Erro ao buscar armário ${numero}:`, findError);
        throw findError;
      }

      if (existing) {
        const { data, error } = await supabase
          .from(TABLE)
          .update({
            nome_colaborador: input.nome_colaborador,
            matricula: input.matricula,
            setor: input.setor,
termo: input.termo,
observacao: input.observacao,
          })
          .eq("id", existing.id)
          .select("*")
          .single();

        if (error) {
          console.error(`Erro ao atualizar armário ${numero}:`, error);
          throw error;
        }

        return mapFromDb(data);
      }

      const { data, error } = await supabase
        .from(TABLE)
        .insert({
  numero,
  genero,
  nome_colaborador: input.nome_colaborador,
  matricula: input.matricula,
  setor: input.setor,
  termo: input.termo,
  observacao: input.observacao,
})
        .select("*")
        .single();

      if (error) {
        console.error(`Erro ao criar armário ${numero}:`, error);
        throw error;
      }

      return mapFromDb(data);
    },

    async update(id: string, updates: Partial<Armario>): Promise<Armario | null> {
      const { data, error } = await supabase
        .from(TABLE)
        .update({
          nome_colaborador: updates.nome_colaborador,
          matricula: updates.matricula,
          setor: updates.setor,
          observacao: updates.observacao,
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        console.error("Erro ao atualizar armário:", error);
        throw error;
      }

      return data ? mapFromDb(data) : null;
    },

    async remove(id: string): Promise<boolean> {
      const { error } = await supabase.from(TABLE).delete().eq("id", id);

      if (error) {
        console.error("Erro ao limpar armário:", error);
        throw error;
      }

      return true;
    },
  };
}

export const armariosMascService = makeService("MASCULINO");
export const armariosFemService = makeService("FEMININO");

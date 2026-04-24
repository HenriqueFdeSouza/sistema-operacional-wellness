import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Lock, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TIPOS_CADEADO,
  armariosFemService,
  armariosMascService,
  type Armario,
  type TipoCadeado,
} from "@/services/armarios";

export const Route = createFileRoute("/_app/armarios")({
  head: () => ({ meta: [{ title: "Armários — Wellness Control Hub" }] }),
  component: ArmariosPage,
});

const TOTAL_DEFAULT = 50;

type Service = typeof armariosMascService;

function ArmariosPage() {
  return (
    <>
      <TopBar
        title="Controle de Armários"
        description="Mapa de armários masculinos e femininos por colaborador."
      />
      <main className="flex-1 p-6 overflow-y-auto">
        <Tabs defaultValue="masc">
          <TabsList>
            <TabsTrigger value="masc">Masculinos</TabsTrigger>
            <TabsTrigger value="fem">Femininos</TabsTrigger>
          </TabsList>
          <TabsContent value="masc" className="mt-6">
            <ArmariosGrid
              service={armariosMascService}
              accentBar="bg-secondary"
              label="MASCULINOS"
            />
          </TabsContent>
          <TabsContent value="fem" className="mt-6">
            <ArmariosGrid
              service={armariosFemService}
              accentBar="bg-pink-500"
              label="FEMININOS"
            />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}

function statusStyle(a: Armario | undefined) {
  if (!a || !a.nome_colaborador.trim()) {
    return "bg-muted text-muted-foreground border-border";
  }
  switch (a.cadeado) {
    case "VAGO":
      return "bg-muted text-muted-foreground border-border";
    case "QUEBRA DE CADEADO":
      return "bg-destructive/15 border-destructive text-destructive";
    case "CADEADO DO COLABORADOR":
      return "bg-warning/20 border-warning text-foreground";
    case "CADEADO DA SEGURANÇA":
      return "bg-success/20 border-success text-foreground";
    default:
      return "bg-card border-border text-foreground";
  }
}

function ArmariosGrid({
  service,
  accentBar,
  label,
}: {
  service: Service;
  accentBar: string;
  label: string;
}) {
  const [items, setItems] = useState<Armario[]>(() => service.list());
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(() => {
    const max = items.reduce((m, a) => Math.max(m, a.numero), 0);
    return Math.max(TOTAL_DEFAULT, max);
  });
  const [editing, setEditing] = useState<{ numero: number; armario?: Armario } | null>(null);

  const refresh = () => setItems(service.list());

  const byNumero = useMemo(() => {
    const m = new Map<number, Armario>();
    items.forEach((a) => m.set(a.numero, a));
    return m;
  }, [items]);

  const cells = useMemo(() => {
    const arr: Array<{ numero: number; armario?: Armario }> = [];
    for (let i = 1; i <= total; i++) {
      arr.push({ numero: i, armario: byNumero.get(i) });
    }
    return arr;
  }, [byNumero, total]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cells;
    return cells.filter((c) => {
      if (String(c.numero).includes(q)) return true;
      const a = c.armario;
      if (!a) return false;
      return (
        a.nome_colaborador.toLowerCase().includes(q) ||
        a.matricula.toLowerCase().includes(q) ||
        a.setor.toLowerCase().includes(q)
      );
    });
  }, [cells, search]);

  const stats = useMemo(() => {
    let ocupados = 0;
    let vagos = 0;
    cells.forEach((c) => {
      if (c.armario && c.armario.nome_colaborador.trim() && c.armario.cadeado !== "VAGO") {
        ocupados++;
      } else {
        vagos++;
      }
    });
    return { ocupados, vagos, total };
  }, [cells, total]);

  return (
    <div className="space-y-4">
      <div className={cn("h-2 rounded-full", accentBar)} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label={`Total ${label}`} value={stats.total} />
        <Stat label="Ocupados" value={stats.ocupados} tone="success" />
        <Stat label="Vagos" value={stats.vagos} tone="warning" />
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 flex-wrap">
        <Lock className="h-5 w-5 text-secondary" />
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nº, nome, matrícula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Label className="text-xs text-muted-foreground">Total</Label>
          <Input
            type="number"
            min={1}
            value={total}
            onChange={(e) => setTotal(Math.max(1, Number(e.target.value) || 1))}
            className="w-24"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          <Legend className="bg-muted border-border" label="Vago" />
          <Legend className="bg-success/20 border-success" label="Cadeado segurança" />
          <Legend className="bg-warning/20 border-warning" label="Cadeado colaborador" />
          <Legend className="bg-destructive/15 border-destructive" label="Quebra de cadeado" />
        </div>
        <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(96px,1fr))]">
          {filtered.map((cell) => (
            <button
              key={cell.numero}
              onClick={() => setEditing(cell)}
              className={cn(
                "border-2 rounded-lg p-2 text-left transition-all hover:scale-[1.03] hover:shadow-md",
                statusStyle(cell.armario),
              )}
            >
              <div className="font-display font-bold text-lg leading-none">
                {String(cell.numero).padStart(2, "0")}
              </div>
              <div className="text-[10px] mt-1 truncate font-medium">
                {cell.armario?.nome_colaborador || "—"}
              </div>
              <div className="text-[9px] truncate opacity-70">
                {cell.armario?.setor || ""}
              </div>
            </button>
          ))}
        </div>
      </div>

      {editing && (
        <ArmarioDialog
          numero={editing.numero}
          armario={editing.armario}
          service={service}
          onClose={() => setEditing(null)}
          onSaved={() => {
            refresh();
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("inline-block h-3 w-3 rounded border", className)} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-secondary";
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`font-display text-3xl font-bold mt-1 ${toneClass}`}>{value}</p>
    </div>
  );
}

function ArmarioDialog({
  numero,
  armario,
  service,
  onClose,
  onSaved,
}: {
  numero: number;
  armario?: Armario;
  service: Service;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(armario?.nome_colaborador ?? "");
  const [matricula, setMatricula] = useState(armario?.matricula ?? "");
  const [setor, setSetor] = useState(armario?.setor ?? "");
  const [cadeado, setCadeado] = useState<TipoCadeado>(armario?.cadeado ?? "VAGO");
  const [observacao, setObservacao] = useState(armario?.observacao ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    service.upsertByNumero(numero, {
      nome_colaborador: nome.trim(),
      matricula: matricula.trim(),
      setor: setor.trim().toUpperCase(),
      cadeado,
      observacao: observacao.trim().toUpperCase(),
    });
    toast.success(`Armário ${numero} atualizado`);
    onSaved();
  };

  const handleDelete = () => {
    if (!armario) return;
    if (!confirm("Limpar este armário?")) return;
    service.remove(armario.id);
    toast.success("Armário liberado");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Armário Nº {numero}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do colaborador</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Matrícula</Label>
              <Input value={matricula} onChange={(e) => setMatricula(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Setor</Label>
              <Input
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                className="uppercase"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Cadeado</Label>
            <Select value={cadeado} onValueChange={(v) => setCadeado(v as TipoCadeado)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS_CADEADO.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Observação</Label>
            <Input
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: TERMO OK, FALTA TERMO, CONFERIDO 14/01/26"
              className="uppercase"
            />
          </div>
          <DialogFooter className="justify-between sm:justify-between">
            {armario ? (
              <Button type="button" variant="ghost" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1 text-destructive" /> Limpar
              </Button>
            ) : <span />}
            <Button type="submit" className="bg-gradient-to-r from-primary to-secondary">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
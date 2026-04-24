import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  POSTOS_CCR,
  STATUS_ITEM,
  TURNOS_CCR,
  ccrService,
  type CCR,
  type PostoCCR,
  type StatusItem,
  type TurnoCCR,
} from "@/services/ccr";
import { dateKey, formatDate, todayKey } from "@/lib/datetime";

export const Route = createFileRoute("/_app/ccr")({
  head: () => ({ meta: [{ title: "CCR — Wellness Control Hub" }] }),
  component: CCRPage,
});

const ITEMS: Array<{ key: keyof CCR; label: string }> = [
  { key: "controle_acesso", label: "Controle de Acesso" },
  { key: "cameras", label: "Câmeras" },
  { key: "radios", label: "Rádios" },
  { key: "cancelas", label: "Cancelas" },
  { key: "alarme", label: "Alarme" },
];

function statusColor(s: StatusItem) {
  if (s === "OK") return "bg-success text-success-foreground";
  if (s === "NOK") return "bg-destructive text-destructive-foreground";
  return "bg-muted text-muted-foreground";
}

function CCRPage() {
  const [items, setItems] = useState<CCR[]>(() => ccrService.list());
  const [open, setOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<string>(todayKey);

  const refresh = () => setItems(ccrService.list());

  const filtered = useMemo(
    () => items.filter((c) => dateKey(c.data) === filterDate),
    [items, filterDate],
  );

  const grouped = useMemo(() => {
    const g: Record<TurnoCCR, CCR[]> = { DIURNO: [], NOTURNO: [] };
    filtered.forEach((c) => g[c.turno].push(c));
    return g;
  }, [filtered]);

  const handleDelete = (id: string) => {
    if (!confirm("Excluir este registro?")) return;
    ccrService.remove(id);
    toast.success("Registro excluído");
    refresh();
  };

  return (
    <>
      <TopBar
        title="CCR — Conformidade com Rotina"
        description="Checklist de segurança por turno e posto."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-secondary">
                <Plus className="h-4 w-4 mr-1" /> Novo registro
              </Button>
            </DialogTrigger>
            <NovoCCRDialog
              onCreated={() => {
                refresh();
                setOpen(false);
              }}
            />
          </Dialog>
        }
      />
      <main className="flex-1 p-6 overflow-y-auto space-y-6">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-secondary" />
          <Label htmlFor="d" className="text-sm">Filtrar por data</Label>
          <Input
            id="d"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-auto"
          />
          <span className="ml-auto text-sm text-muted-foreground capitalize">
            {formatDate(new Date(filterDate + "T12:00:00").toISOString())}
          </span>
        </div>

        {(["DIURNO", "NOTURNO"] as const).map((turno) => (
          <div key={turno} className="bg-card border border-border rounded-xl">
            <div className="px-4 py-3 border-b border-border bg-muted/40 rounded-t-xl">
              <h3 className="font-display font-bold text-foreground">{turno}</h3>
            </div>
            {grouped[turno].length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Sem registros para este turno.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horário</TableHead>
                      <TableHead>Agente</TableHead>
                      <TableHead>Posto</TableHead>
                      {ITEMS.map((i) => (
                        <TableHead key={i.key as string}>{i.label}</TableHead>
                      ))}
                      <TableHead>Ação corretiva</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grouped[turno].map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.horario}</TableCell>
                        <TableCell className="font-medium">{c.agente || "—"}</TableCell>
                        <TableCell className="text-xs">{c.posto}</TableCell>
                        {ITEMS.map((i) => {
                          const v = c[i.key] as StatusItem;
                          return (
                            <TableCell key={i.key as string}>
                              <span className={cn("inline-flex px-2 py-0.5 rounded text-xs font-semibold", statusColor(v))}>
                                {v}
                              </span>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {c.acao_corretiva || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ))}
      </main>
    </>
  );
}

function NovoCCRDialog({ onCreated }: { onCreated: () => void }) {
  const [turno, setTurno] = useState<TurnoCCR>("DIURNO");
  const [horario, setHorario] = useState("07:00-19:00");
  const [agente, setAgente] = useState("");
  const [posto, setPosto] = useState<PostoCCR>("RONDANTE");
  const [statuses, setStatuses] = useState<Record<string, StatusItem>>({
    controle_acesso: "OK",
    cameras: "OK",
    radios: "OK",
    cancelas: "OK",
    alarme: "NSA",
  });
  const [acao, setAcao] = useState("");
  const [status, setStatus] = useState("");

  const setItem = (key: string, v: StatusItem) =>
    setStatuses((prev) => ({ ...prev, [key]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    ccrService.create({
      turno,
      horario: horario.trim(),
      agente: agente.trim(),
      posto,
      controle_acesso: statuses.controle_acesso,
      cameras: statuses.cameras,
      radios: statuses.radios,
      cancelas: statuses.cancelas,
      alarme: statuses.alarme,
      acao_corretiva: acao.trim(),
      status: status.trim(),
    });
    toast.success("Checklist registrado");
    setAgente("");
    setAcao("");
    setStatus("");
    onCreated();
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Novo checklist CCR</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Turno</Label>
            <Select value={turno} onValueChange={(v) => setTurno(v as TurnoCCR)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TURNOS_CCR.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Horário</Label>
            <Input value={horario} onChange={(e) => setHorario(e.target.value)} placeholder="07:00-19:00" />
          </div>
          <div className="space-y-2">
            <Label>Posto</Label>
            <Select value={posto} onValueChange={(v) => setPosto(v as PostoCCR)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {POSTOS_CCR.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Agente</Label>
          <Input value={agente} onChange={(e) => setAgente(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Itens verificados</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {ITEMS.map((it) => (
              <div key={it.key as string} className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs font-medium mb-2">{it.label}</p>
                <div className="flex gap-1">
                  {STATUS_ITEM.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setItem(it.key as string, s)}
                      className={cn(
                        "flex-1 px-2 py-1.5 rounded text-xs font-semibold transition-colors",
                        statuses[it.key as string] === s
                          ? statusColor(s)
                          : "bg-background border border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Ação corretiva (opcional)</Label>
            <Textarea value={acao} onChange={(e) => setAcao(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Status (opcional)</Label>
            <Textarea value={status} onChange={(e) => setStatus(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" className="bg-gradient-to-r from-primary to-secondary">
            Salvar checklist
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
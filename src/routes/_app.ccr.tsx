import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
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
  head: () => ({
    meta: [{ title: "CCR — Wellness Control Hub" }],
  }),
  component: CCRPage,
});

const ITEMS: Array<{ key: keyof CCR; label: string }> = [
  { key: "controle_acesso", label: "Controle de Acesso" },
  { key: "cameras", label: "Câmeras" },
  { key: "radios", label: "Rádios" },
  { key: "cancelas", label: "Cancelas" },
  { key: "alarme", label: "Alarme" },
];

type AgentePosto = {
  nome: string;
  posto: PostoCCR;
};

function statusColor(s: StatusItem) {
  if (s === "OK") return "bg-success text-success-foreground";
  if (s === "NOK") return "bg-destructive text-destructive-foreground";
  return "bg-muted text-muted-foreground";
}

function CCRPage() {
  const [items, setItems] = useState(() => ccrService.list());
  const [open, setOpen] = useState(false);
  const [filterDate, setFilterDate] = useState(todayKey);

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
  title="Checklist CCR"
  description="Controle operacional por turno."
  actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-secondary">
                <Plus size={18} />
                Novo registro
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

      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Registros do dia</h2>
            <p className="text-sm text-muted-foreground">
              {formatDate(new Date(filterDate + "T12:00:00").toISOString())}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="filter-date" className="text-sm">
              Filtrar por data
            </Label>
            <Input
              id="filter-date"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>

        {(["DIURNO", "NOTURNO"] as const).map((turno) => (
          <section key={turno} className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b bg-muted/40">
              <ShieldCheck size={18} className="text-primary" />
              <h3 className="text-lg font-bold">{turno}</h3>
            </div>

            {grouped[turno].length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                Sem registros para este turno.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    <TableHead>Agente</TableHead>
                    <TableHead>Posto</TableHead>
                    {ITEMS.map((i) => (
                      <TableHead key={i.key}>{i.label}</TableHead>
                    ))}
                    <TableHead>Ação corretiva</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {grouped[turno].map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.horario}</TableCell>
                      <TableCell className="font-medium">{c.agente || "—"}</TableCell>
                      <TableCell>{c.posto}</TableCell>

                      {ITEMS.map((i) => {
                        const v = c[i.key] as StatusItem;
                        return (
                          <TableCell key={i.key}>
                            <span
                              className={cn(
                                "inline-flex rounded px-2 py-1 text-xs font-bold",
                                statusColor(v),
                              )}
                            >
                              {v}
                            </span>
                          </TableCell>
                        );
                      })}

                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {c.acao_corretiva || "—"}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                        {c.status || "—"}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        ))}
      </main>
    </>
  );
}

function NovoCCRDialog({ onCreated }: { onCreated: () => void }) {
  const [turno, setTurno] = useState<TurnoCCR>("DIURNO");
  const [horario, setHorario] = useState("07:00-19:00");

  const [agentes, setAgentes] = useState<AgentePosto[]>([
    {
      nome: "",
      posto: "RONDANTE",
    },
  ]);

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

  function atualizarAgente(index: number, campo: "nome" | "posto", valor: string) {
    setAgentes((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [campo]: campo === "posto" ? (valor as PostoCCR) : valor,
            }
          : item,
      ),
    );
  }

  function adicionarAgente() {
    setAgentes((prev) => [
      ...prev,
      {
        nome: "",
        posto: "RONDANTE",
      },
    ]);
  }

  function removerAgente(index: number) {
    setAgentes((prev) => {
      if (prev.length === 1) {
        return prev;
      }

      return prev.filter((_, i) => i !== index);
    });
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();

    const agentesValidos = agentes
      .map((agente) => ({
        nome: agente.nome.trim(),
        posto: agente.posto,
      }))
      .filter((agente) => agente.nome !== "");

    if (agentesValidos.length === 0) {
      toast.error("Informe pelo menos 1 agente");
      return;
    }

    for (const agente of agentesValidos) {
      ccrService.create({
        turno,
        horario: horario.trim(),
        agente: agente.nome,
        posto: agente.posto,
        controle_acesso: statuses.controle_acesso,
        cameras: statuses.cameras,
        radios: statuses.radios,
        cancelas: statuses.cancelas,
        alarme: statuses.alarme,
        acao_corretiva: acao.trim(),
        status: status.trim(),
      });
    }

    toast.success(
      agentesValidos.length === 1
        ? "Checklist registrado"
        : `${agentesValidos.length} checklists registrados`,
    );

    setAgentes([
      {
        nome: "",
        posto: "RONDANTE",
      },
    ]);
    setAcao("");
    setStatus("");
    onCreated();
  };

  return (
    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Novo checklist CCR</DialogTitle>
      </DialogHeader>

      <form onSubmit={submit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Turno</Label>
            <Select
              value={turno}
              onValueChange={(v) => {
                const novoTurno = v as TurnoCCR;
                setTurno(novoTurno);
                setHorario(novoTurno === "NOTURNO" ? "19:00-07:00" : "07:00-19:00");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {TURNOS_CCR.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Horário</Label>
            <Input
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              placeholder="07:00-19:00"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Agentes e postos</Label>
            <p className="text-xs text-muted-foreground">
              Adicione todos os agentes do turno e selecione o posto de cada um.
            </p>
          </div>

          <div className="space-y-3">
            {agentes.map((item, index) => (
              <div key={index} className="grid sm:grid-cols-[1fr_240px_auto] gap-3 items-end">
                <div className="space-y-2">
                  <Label>Agente {index + 1}</Label>
                  <Input
                    value={item.nome}
                    onChange={(e) => atualizarAgente(index, "nome", e.target.value)}
                    placeholder="Nome do agente"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Posto</Label>
                  <Select
                    value={item.posto}
                    onValueChange={(value) => atualizarAgente(index, "posto", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {POSTOS_CCR.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => removerAgente(index)}
                  disabled={agentes.length === 1}
                  title="Remover agente"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={adicionarAgente}>
            + Adicionar agente
          </Button>
        </div>

        <div>
          <Label>Itens verificados</Label>

          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            {ITEMS.map((it) => (
              <div key={it.key} className="rounded-xl bg-muted/30 p-3 space-y-2">
                <p className="text-sm font-medium">{it.label}</p>

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

        <div className="grid sm:grid-cols-2 gap-4">
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

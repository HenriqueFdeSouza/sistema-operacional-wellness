import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, RotateCcw, Trash2, KeyRound } from "lucide-react";
import { chavesService, type Chave } from "@/services/chaves";
import {
  toLocalInput,
  fromLocalInput,
  formatDateTime,
  dateKey,
  todayKey,
} from "@/lib/datetime";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SETORES_CHAVE = [
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
];

const AGENTES_OPERACIONAIS = [
  "AMANDA LUIZA",
  "BRENO LIMA",
  "EDUARDO",
  "ELIABE FALCÃO",
  "GEICIANE SILVA",
  "GERMANA OLIVEIRA",
  "HENRIQUE SOUZA",
  "KAUÃ VITOR",
  "KAYO DOUGLAS",
  "MATEUS BARBOSA",
  "NAIARA",
  "RAFAEL",
  "SAMUEL VIANA",
  "THAMARA MENEZES",
  "VINÍCIOS",
  "WAGNER COSTA",
];

export const Route = createFileRoute("/_app/chaves")({
  head: () => ({ meta: [{ title: "Chaves — Wellness Control Hub" }] }),
  component: ChavesPage,
});

function ChavesPage() {
  const [items, setItems] = useState<Chave[]>(() => chavesService.list());
  const [open, setOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<string>(todayKey);

  const refresh = () => setItems(chavesService.list());

  const filtered = useMemo(
    () => items.filter((r) => dateKey(r.horario_saida) === filterDate),
    [items, filterDate],
  );

  const abertos = filtered.filter((r) => !r.horario_retorno).length;

  const handleDelete = (id: string) => {
    if (!confirm("Excluir este registro?")) return;
    chavesService.remove(id);
    toast.success("Registro excluído");
    refresh();
  };

  return (
    <>
      <TopBar
        title="Controle de Chaves"
        description="Saída e retorno de chaves operacionais."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-secondary">
                <Plus className="h-4 w-4 mr-1" /> Nova saída
              </Button>
            </DialogTrigger>
            <NovaChaveDialog
              onCreated={() => {
                refresh();
                setOpen(false);
              }}
            />
          </Dialog>
        }
      />
      <main className="flex-1 p-6 overflow-y-auto space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total no dia" value={filtered.length} />
          <StatCard label="Abertas" value={abertos} tone="warning" />
          <StatCard label="Fechadas" value={filtered.length - abertos} tone="success" />
        </div>

        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="h-4 w-4 text-secondary" /> Registros do dia
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-date" className="text-xs text-muted-foreground">
                Data
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

          {filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Nenhum registro nesta data.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chave</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Colab. saída</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Agente</TableHead>
                    <TableHead>Retorno</TableHead>
                    <TableHead>Colab. retorno</TableHead>
                    <TableHead>Agente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <ChaveRow key={r.id} chave={r} onChange={refresh} onDelete={handleDelete} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function ChaveRow({
  chave,
  onChange,
  onDelete,
}: {
  chave: Chave;
  onChange: () => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <TableRow>
      <TableCell className="font-mono font-medium">{chave.chave}</TableCell>
      <TableCell className="text-xs">{formatDateTime(chave.horario_saida)}</TableCell>
      <TableCell>{chave.colaborador_saida}</TableCell>
      <TableCell className="text-xs">{chave.setor_saida}</TableCell>
      <TableCell className="text-xs">{chave.agente_saida}</TableCell>
      <TableCell className="text-xs">{formatDateTime(chave.horario_retorno)}</TableCell>
      <TableCell>{chave.colaborador_retorno ?? "—"}</TableCell>
      <TableCell className="text-xs">{chave.agente_retorno ?? "—"}</TableCell>
      <TableCell>
        {chave.horario_retorno ? (
          <Badge className="bg-success text-success-foreground">FECHADO</Badge>
        ) : (
          <Badge className="bg-warning text-warning-foreground">ABERTO</Badge>
        )}
      </TableCell>
      <TableCell className="text-right space-x-1">
        {!chave.horario_retorno && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <RotateCcw className="h-3 w-3 mr-1" /> Retorno
              </Button>
            </DialogTrigger>
            <RetornoDialog
              chave={chave}
              onDone={() => {
                onChange();
                setOpen(false);
              }}
            />
          </Dialog>
        )}
        <Button size="icon" variant="ghost" onClick={() => onDelete(chave.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : "text-secondary";
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`font-display text-3xl font-bold mt-1 ${toneClass}`}>{value}</p>
    </div>
  );
}

function NovaChaveDialog({ onCreated }: { onCreated: () => void }) {
  const [chave, setChave] = useState("");
  const [colab, setColab] = useState("");
  const [setor, setSetor] = useState("");
  const [agente, setAgente] = useState("");
  const [saida, setSaida] = useState(() => toLocalInput(new Date().toISOString()));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chave.trim() || !colab.trim() || !setor.trim() || !agente.trim()) {
  toast.error("Preencha chave, colaborador, setor e agente que entregou");
  return;
}
    chavesService.create({
      chave: chave.trim(),
      colaborador_saida: colab.trim(),
      setor_saida: setor.trim().toUpperCase(),
      horario_saida: fromLocalInput(saida),
      agente_saida: agente.trim(),
    });
    toast.success("Saída registrada");
    setChave("");
    setColab("");
    setSetor("");
    setAgente("");
    onCreated();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova saída de chave</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="chave">Chave</Label>
            <Input
              id="chave"
              value={chave}
              onChange={(e) => setChave(e.target.value)}
              placeholder="Nº ou código"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="saida">Horário saída</Label>
            <Input
              id="saida"
              type="datetime-local"
              value={saida}
              onChange={(e) => setSaida(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="colab">Colaborador</Label>
          <Input id="colab" value={colab} onChange={(e) => setColab(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
  <Label htmlFor="setor">Setor</Label>
  <Select value={setor} onValueChange={setSetor}>
    <SelectTrigger id="setor">
      <SelectValue placeholder="Selecione o setor" />
    </SelectTrigger>
    <SelectContent>
      {SETORES_CHAVE.map((s) => (
        <SelectItem key={s} value={s}>
          {s}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
          <div className="space-y-2">
  <Label htmlFor="agente">Agente que entregou</Label>
  <Select value={agente} onValueChange={setAgente}>
    <SelectTrigger id="agente">
      <SelectValue placeholder="Selecione o agente" />
    </SelectTrigger>
    <SelectContent>
      {AGENTES_OPERACIONAIS.map((nome) => (
        <SelectItem key={nome} value={nome}>
          {nome}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
        </div>
        <DialogFooter>
          <Button type="submit" className="bg-gradient-to-r from-primary to-secondary">
            Registrar saída
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function RetornoDialog({ chave, onDone }: { chave: Chave; onDone: () => void }) {
  const [colab, setColab] = useState(chave.colaborador_saida);
  const [setor, setSetor] = useState(chave.setor_saida);
  const [agente, setAgente] = useState("");
  const [horario, setHorario] = useState(() => toLocalInput(new Date().toISOString()));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    chavesService.registrarRetorno(chave.id, {
      colaborador_retorno: colab.trim(),
      setor_retorno: setor.trim().toUpperCase(),
      agente_retorno: agente.trim(),
      horario_retorno: fromLocalInput(horario),
    });
    toast.success("Retorno registrado");
    onDone();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Registrar retorno — Chave {chave.chave}</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Colaborador retorno</Label>
            <Input value={colab} onChange={(e) => setColab(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Setor</Label>
            <Input value={setor} onChange={(e) => setSetor(e.target.value)} className="uppercase" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Agente</Label>
            <Input value={agente} onChange={(e) => setAgente(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Horário retorno</Label>
            <Input
              type="datetime-local"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" className="bg-gradient-to-r from-primary to-secondary">
            Confirmar retorno
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
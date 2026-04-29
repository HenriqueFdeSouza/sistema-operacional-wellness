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
import { Plus, RotateCcw, Trash2, Wrench } from "lucide-react";
import {
  toLocalInput,
  fromLocalInput,
  formatDateTime,
  dateKey,
  todayKey,
} from "@/lib/datetime";
import type { Mestra } from "@/services/mestras";

interface MestrasService {
  list(): Mestra[];
  create(input: {
    colaborador: string;
    setor: string;
    horario_saida: string;
    agente_saida: string;
  }): Mestra;
  registrarRetorno(
    id: string,
    input: { agente_retorno: string; horario_retorno?: string },
  ): Mestra | null;
  remove(id: string): boolean;
}

interface Props {
  title: string;
  description: string;
  service: MestrasService;
  setores: readonly string[];
}

export function MestrasPage({ title, description, service, setores }: Props) {
  const [items, setItems] = useState<Mestra[]>(() => service.list());
  const [open, setOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<string>(todayKey);

  const refresh = () => setItems(service.list());

  const filtered = useMemo(
    () => items.filter((m) => dateKey(m.horario_saida) === filterDate),
    [items, filterDate],
  );

  const abertos = filtered.filter((m) => !m.horario_retorno).length;

  const handleDelete = (id: string) => {
    if (!confirm("Excluir este registro?")) return;
    service.remove(id);
    toast.success("Registro excluído");
    refresh();
  };

  return (
    <>
      <TopBar
        title={title}
        description={description}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-secondary">
                <Plus className="h-4 w-4 mr-1" /> Nova saída
              </Button>
            </DialogTrigger>
            <NovaMestraDialog
              service={service}
              setores={setores}
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
          <Stat label="Total no dia" value={filtered.length} />
          <Stat label="Em uso" value={abertos} tone="warning" />
          <Stat label="Devolvidas" value={filtered.length - abertos} tone="success" />
        </div>

        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wrench className="h-4 w-4 text-secondary" /> Registros do dia
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Data</Label>
              <Input
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
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Agente que entregou</TableHead>
<TableHead>Retorno</TableHead>
<TableHead>Agente que recebeu</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => (
                    <Row
                      key={m.id}
                      m={m}
                      service={service}
                      onChange={refresh}
                      onDelete={handleDelete}
                    />
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

function Row({
  m,
  service,
  onChange,
  onDelete,
}: {
  m: Mestra;
  service: MestrasService;
  onChange: () => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [agente, setAgente] = useState("");
  const [horario, setHorario] = useState(() => toLocalInput(new Date().toISOString()));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    service.registrarRetorno(m.id, {
      agente_retorno: agente.trim(),
      horario_retorno: fromLocalInput(horario),
    });
    toast.success("Retorno registrado");
    setOpen(false);
    onChange();
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{m.colaborador}</TableCell>
      <TableCell className="text-xs">{m.setor}</TableCell>
      <TableCell className="text-xs">{formatDateTime(m.horario_saida)}</TableCell>
      <TableCell className="text-xs align-middle text-left">
  {m.agente_saida}
</TableCell>

<TableCell className="text-xs align-middle">
  {formatDateTime(m.horario_retorno)}
</TableCell>

<TableCell className="text-xs align-middle text-left">
  {m.agente_retorno ?? "—"}
</TableCell>
      <TableCell>
        {m.horario_retorno ? (
          <Badge className="bg-success text-success-foreground">Devolvida</Badge>
        ) : (
          <Badge className="bg-warning text-warning-foreground">Em uso</Badge>
        )}
      </TableCell>
      <TableCell className="text-right space-x-1">
        {!m.horario_retorno && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <RotateCcw className="h-3 w-3 mr-1" /> Retorno
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar retorno — {m.colaborador}</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Agente que recebeu</Label>
<Input value={agente} onChange={(e) => setAgente(e.target.value)} autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário</Label>
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
          </Dialog>
        )}
        <Button size="icon" variant="ghost" onClick={() => onDelete(m.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function NovaMestraDialog({
  service,
  setores,
  onCreated,
}: {
  service: MestrasService;
  setores: readonly string[];
  onCreated: () => void;
}) {
  const [colaborador, setColaborador] = useState("");
  const [setor, setSetor] = useState<string>(setores[0]);
  const [agente, setAgente] = useState("");
  const [saida, setSaida] = useState(() => toLocalInput(new Date().toISOString()));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colaborador.trim()) {
      toast.error("Informe o colaborador");
      return;
    }
    service.create({
      colaborador: colaborador.trim(),
      setor,
      horario_saida: fromLocalInput(saida),
      agente_saida: agente.trim(),
    });
    toast.success("Saída registrada");
    setColaborador("");
    setAgente("");
    onCreated();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova saída de mestra</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label>Colaborador</Label>
          <Input value={colaborador} onChange={(e) => setColaborador(e.target.value)} autoFocus />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Setor</Label>
            <Select value={setor} onValueChange={setSetor}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {setores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Horário saída</Label>
            <Input type="datetime-local" value={saida} onChange={(e) => setSaida(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Agente que entregou</Label>
<Input value={agente} onChange={(e) => setAgente(e.target.value)} />
        </div>
        <DialogFooter>
          <Button type="submit" className="bg-gradient-to-r from-primary to-secondary">
            Registrar
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
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
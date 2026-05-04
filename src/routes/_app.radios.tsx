import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { Plus, RotateCcw, Trash2, Radio as RadioIcon, Search } from "lucide-react";
import {
  ALTERACOES_RADIO,
  SETORES_RADIO,
  radiosService,
  type AlteracaoRadio,
  type Radio as RadioItem,
  type SetorRadio,
} from "@/services/radios";

export const Route = createFileRoute("/_app/radios")({
  head: () => ({ meta: [{ title: "Rádios — Wellness Control Hub" }] }),
  component: RadiosPage,
});

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInput(value: string) {
  return new Date(value).toISOString();
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function todayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function RadiosPage() {
  const [items, setItems] = useState<RadioItem[]>([]);
  const [buscaNome, setBuscaNome] = useState("");
const [buscaRadio, setBuscaRadio] = useState("");
  const [open, setOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await radiosService.list();
      setItems(data);
    } catch (error) {
      toast.error("Erro ao carregar registros de rádios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
  const nome = buscaNome.trim().toLowerCase();
  const radio = buscaRadio.trim().toLowerCase();

  return items.filter((r) => {
    const sameDate = todayKey(r.saida) === filterDate;

    const matchNome =
      !nome || r.colaborador.toLowerCase().includes(nome);

    const matchRadio =
      !radio || r.id_radio.toLowerCase().includes(radio);

    return sameDate && matchNome && matchRadio;
  });
}, [items, filterDate, buscaNome, buscaRadio]);

  const abertos = filtered.filter((r) => !r.retorno).length;

  const handleRetorno = async (id: string) => {
    try {
      await radiosService.registrarRetorno(id);
      toast.success("Retorno registrado");
      await refresh();
    } catch (error) {
      toast.error("Erro ao registrar retorno");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este registro?")) return;

    try {
      await radiosService.remove(id);
      toast.success("Registro excluído");
      await refresh();
    } catch (error) {
      toast.error("Erro ao excluir registro");
    }
  };

  return (
    <>
      <TopBar
        title="Controle de Rádios"
        description="Entrega e devolução de rádios por colaborador e setor."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-secondary">
                <Plus className="h-4 w-4 mr-1" /> Nova entrega
              </Button>
            </DialogTrigger>
            <NovaEntregaDialog
              onCreated={async () => {
                await refresh();
                setOpen(false);
              }}
            />
          </Dialog>
        }
      />

      <main className="flex-1 p-6 overflow-y-auto space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total no dia" value={filtered.length} />
          <StatCard label="Em uso" value={abertos} tone="warning" />
          <StatCard label="Devolvidos" value={filtered.length - abertos} tone="success" />
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
  <div className="grid gap-4 md:grid-cols-2">
    
    <div className="space-y-1">
      <p className="text-sm font-semibold text-foreground">
        Buscar por Nome
      </p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
        <Input
          placeholder="Ex: Henrique"
          value={buscaNome}
          onChange={(e) => setBuscaNome(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>

    <div className="space-y-1">
      <p className="text-sm font-semibold text-foreground">
        Buscar por Rádio
      </p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
        <Input
          placeholder="Ex: 75TR"
          value={buscaRadio}
          onChange={(e) => setBuscaRadio(e.target.value)}
          className="pl-9 uppercase"
        />
      </div>
    </div>

  </div>

  <p className="text-sm text-muted-foreground">
    {filtered.length} de {items.length} registros
  </p>
</div>
        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <RadioIcon className="h-4 w-4 text-secondary" />
              Registros do dia
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

          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Carregando registros...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Nenhum registro nesta data.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Rádio</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Alteração</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Retorno</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.colaborador}</TableCell>
                      <TableCell className="font-mono">{r.id_radio}</TableCell>
                      <TableCell>{r.setor}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.alteracao}</TableCell>
                      <TableCell className="text-xs">{formatDateTime(r.saida)}</TableCell>
                      <TableCell className="text-xs">{formatDateTime(r.retorno)}</TableCell>
                      <TableCell>
                        {r.retorno ? (
                          <Badge className="bg-success text-success-foreground">Devolvido</Badge>
                        ) : (
                          <Badge className="bg-warning text-warning-foreground">Em uso</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {!r.retorno && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetorno(r.id)}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" /> Retorno
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(r.id)}
                          aria-label="Excluir"
                        >
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
      </main>
    </>
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

function NovaEntregaDialog({ onCreated }: { onCreated: () => Promise<void> }) {
  const [colaborador, setColaborador] = useState("");
  const [idRadio, setIdRadio] = useState("");
  const [setor, setSetor] = useState<SetorRadio>("A&B");
  const [alteracao, setAlteracao] = useState<AlteracaoRadio>("RADIO");
  const [saida, setSaida] = useState(() => toLocalInput(new Date().toISOString()));
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!colaborador.trim() || !idRadio.trim()) {
      toast.error("Preencha colaborador e ID do rádio");
      return;
    }

    try {
      setSaving(true);
      await radiosService.create({
        colaborador: colaborador.trim(),
        id_radio: idRadio.trim().toUpperCase(),
        setor,
        alteracao,
        saida: fromLocalInput(saida),
      });

      toast.success("Rádio entregue");
      setColaborador("");
      setIdRadio("");
      await onCreated();
    } catch (error) {
      toast.error("Erro ao registrar entrega");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova entrega de rádio</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="colab">Colaborador</Label>
          <Input
            id="colab"
            value={colaborador}
            onChange={(e) => setColaborador(e.target.value)}
            placeholder="Nome do colaborador"
            autoFocus
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rid">ID do Rádio</Label>
            <Input
              id="rid"
              value={idRadio}
              onChange={(e) => setIdRadio(e.target.value)}
              placeholder="Ex: 75TR"
              className="uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label>Setor</Label>
            <Select value={setor} onValueChange={(v) => setSetor(v as SetorRadio)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SETORES_RADIO.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Alteração</Label>
            <Select
              value={alteracao}
              onValueChange={(v) => setAlteracao(v as AlteracaoRadio)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALTERACOES_RADIO.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="saida">Saída</Label>
            <Input
              id="saida"
              type="datetime-local"
              value={saida}
              onChange={(e) => setSaida(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            {saving ? "Registrando..." : "Registrar entrega"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

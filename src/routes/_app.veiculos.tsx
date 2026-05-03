import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Car, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  OBSERVACOES_VEICULO,
  veiculosService,
  type ObservacaoVeiculo,
  type Veiculo,
} from "@/services/veiculos";

export const Route = createFileRoute("/_app/veiculos")({
  head: () => ({ meta: [{ title: "Veículos — Wellness Control Hub" }] }),
  component: VeiculosPage,
});

const PAGE_SIZE = 10;

function badgeColor(o: ObservacaoVeiculo) {
  switch (o) {
    case "PROPRIETÁRIO":
      return "bg-success text-success-foreground";
    case "PRESTADOR DE SERVIÇO":
      return "bg-secondary text-secondary-foreground";
    case "GESTOR":
      return "bg-accent text-accent-foreground";
    case "VISITANTE":
      return "bg-warning text-warning-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function VeiculosPage() {
  const [items, setItems] = useState<Veiculo[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Veiculo | null>(null);
  const [buscaNome, setBuscaNome] = useState("");
  const [buscaUh, setBuscaUh] = useState("");
  const [buscaPlaca, setBuscaPlaca] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await veiculosService.list();
      setItems(data);
    } catch (error) {
      toast.error("Erro ao carregar veículos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [buscaNome, buscaUh, buscaPlaca]);

  const filtered = useMemo(() => {
    const nome = normalizeText(buscaNome);
    const uh = normalizeText(buscaUh);
    const placa = normalizeText(buscaPlaca);

    return items.filter((v) => {
      const matchNome = !nome || normalizeText(v.nome).includes(nome);
      const matchUh = !uh || normalizeText(v.uh).includes(uh);
      const matchPlaca = !placa || normalizeText(v.placa).includes(placa);

      return matchNome && matchUh && matchPlaca;
    });
  }, [items, buscaNome, buscaUh, buscaPlaca]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const hasActiveSearch =
    buscaNome.trim() !== "" || buscaUh.trim() !== "" || buscaPlaca.trim() !== "";

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este veículo?")) return;

    try {
      await veiculosService.remove(id);
      toast.success("Veículo excluído");
      await refresh();
    } catch (error) {
      toast.error("Erro ao excluir veículo");
    }
  };

  return (
    <>
      <TopBar
        title="Controle de Veículos"
        description="Cadastro e busca de veículos autorizados."
        actions={
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-primary to-secondary"
                onClick={() => setEditing(null)}
              >
                <Plus className="h-4 w-4 mr-1" /> Novo veículo
              </Button>
            </DialogTrigger>
            <VeiculoDialog
              veiculo={editing}
              onSaved={async () => {
                await refresh();
                setOpen(false);
                setEditing(null);
              }}
            />
          </Dialog>
        }
      />
      <main className="flex-1 p-6 overflow-y-auto space-y-6">
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">

  {/* PLACA */}
  <div className="space-y-1">
    <p className="text-sm font-semibold text-foreground">
      Buscar por Placa
    </p>
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
      <Input
        placeholder="Ex: NXZ10A"
        value={buscaPlaca}
        onChange={(e) => setBuscaPlaca(e.target.value)}
        className="pl-9"
      />
    </div>
  </div>

  {/* NOME */}
  <div className="space-y-1">
    <p className="text-sm font-semibold text-foreground">
      Buscar por Nome
    </p>
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
      <Input
        placeholder="Ex: João"
        value={buscaNome}
        onChange={(e) => setBuscaNome(e.target.value)}
        className="pl-9"
      />
    </div>
  </div>

  {/* UH */}
  <div className="space-y-1">
    <p className="text-sm font-semibold text-foreground">
      Buscar por UH
    </p>
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
      <Input
        placeholder="Ex: 3405"
        value={buscaUh}
        onChange={(e) => setBuscaUh(e.target.value)}
        className="pl-9"
      />
    </div>
  </div>

</div>

          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              {filtered.length} de {items.length} veículo{items.length === 1 ? "" : "s"}
            </span>

            {hasActiveSearch && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBuscaNome("");
                  setBuscaUh("");
                  setBuscaPlaca("");
                }}
              >
                Limpar busca
              </Button>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border flex items-center gap-2 text-sm font-medium">
            <Car className="h-4 w-4 text-secondary" /> Veículos cadastrados
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Carregando veículos...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Nenhum veículo encontrado.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>UH</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Carro</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Autorizações</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono text-xs">{v.uh}</TableCell>
                        <TableCell className="font-medium">{v.nome}</TableCell>
                        <TableCell>{v.carro}</TableCell>
                        <TableCell className="text-xs">{v.cor}</TableCell>
                        <TableCell className="font-mono">{v.placa}</TableCell>
                        <TableCell>
                          <Badge className={badgeColor(v.observacoes)}>{v.observacoes}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {v.autorizacoes || "—"}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditing(v);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(v.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Mostrando {(safePage - 1) * PAGE_SIZE + 1}-
                  {Math.min(safePage * PAGE_SIZE, filtered.length)} de {filtered.length}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>

                  <span className="text-xs text-muted-foreground">
                    Página {safePage} de {totalPages}
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function VeiculoDialog({
  veiculo,
  onSaved,
}: {
  veiculo: Veiculo | null;
  onSaved: () => Promise<void>;
}) {
  const [uh, setUh] = useState(veiculo?.uh ?? "");
  const [nome, setNome] = useState(veiculo?.nome ?? "");
  const [carro, setCarro] = useState(veiculo?.carro ?? "");
  const [cor, setCor] = useState(veiculo?.cor ?? "");
  const [placa, setPlaca] = useState(veiculo?.placa ?? "");
  const [observacoes, setObservacoes] = useState<ObservacaoVeiculo>(
    veiculo?.observacoes ?? "PROPRIETÁRIO",
  );
  const [autorizacoes, setAutorizacoes] = useState(veiculo?.autorizacoes ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!placa.trim()) {
      toast.error("Informe a placa");
      return;
    }

    const data = {
      uh: uh.trim(),
      nome: nome.trim() || "SEM NOME",
      carro: carro.trim(),
      cor: cor.trim(),
      placa: placa.trim().toUpperCase(),
      observacoes,
      autorizacoes: autorizacoes.trim(),
    };

    try {
      setSaving(true);

      if (veiculo) {
        await veiculosService.update(veiculo.id, data);
        toast.success("Veículo atualizado");
      } else {
        await veiculosService.create(data);
        toast.success("Veículo cadastrado");
      }

      await onSaved();
    } catch (error) {
      toast.error(veiculo ? "Erro ao atualizar veículo" : "Erro ao cadastrar veículo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>{veiculo ? "Editar veículo" : "Novo veículo"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>UH</Label>
            <Input value={uh} onChange={(e) => setUh(e.target.value)} placeholder="Ex: 3406" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Carro</Label>
            <Input value={carro} onChange={(e) => setCarro(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <Input value={cor} onChange={(e) => setCor(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Placa</Label>
            <Input value={placa} onChange={(e) => setPlaca(e.target.value)} className="uppercase" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>

          <Input
            list="tipos-veiculo"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value as ObservacaoVeiculo)}
            placeholder="Selecione ou digite o tipo"
          />

          <datalist id="tipos-veiculo">
            {OBSERVACOES_VEICULO.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </div>
        <div className="space-y-2">
          <Label>Autorizações (opcional)</Label>
          <Textarea
            value={autorizacoes}
            onChange={(e) => setAutorizacoes(e.target.value)}
            rows={2}
          />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            {saving ? "Salvando..." : veiculo ? "Salvar alterações" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

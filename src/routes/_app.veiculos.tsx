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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Car, Pencil, Plus, Search, Trash2 } from "lucide-react";
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

function badgeColor(o: ObservacaoVeiculo) {
  switch (o) {
    case "PROPRIETÁRIO":
      return "bg-success text-success-foreground";
    case "LOCATÁRIO":
      return "bg-secondary text-secondary-foreground";
    case "VISITANTE/PROCURADOR":
      return "bg-warning text-warning-foreground";
    case "GOVERNANÇA":
      return "bg-accent text-accent-foreground";
  }
}

function VeiculosPage() {
  const [items, setItems] = useState<Veiculo[]>(() => veiculosService.list());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Veiculo | null>(null);
  const [q, setQ] = useState("");

  const refresh = () => setItems(veiculosService.list());

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (v) =>
        v.nome.toLowerCase().includes(s) ||
        v.placa.toLowerCase().includes(s) ||
        v.uh.toLowerCase().includes(s) ||
        v.carro.toLowerCase().includes(s),
    );
  }, [items, q]);

  const handleDelete = (id: string) => {
    if (!confirm("Excluir este veículo?")) return;
    veiculosService.remove(id);
    toast.success("Veículo excluído");
    refresh();
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
              onSaved={() => {
                refresh();
                setOpen(false);
                setEditing(null);
              }}
            />
          </Dialog>
        }
      />
      <main className="flex-1 p-6 overflow-y-auto space-y-6">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <Search className="h-5 w-5 text-secondary" />
          <Input
            placeholder="Buscar por nome, placa, UH ou carro..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-md"
          />
          <span className="ml-auto text-sm text-muted-foreground">
            {filtered.length} de {items.length}
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border flex items-center gap-2 text-sm font-medium">
            <Car className="h-4 w-4 text-secondary" /> Veículos cadastrados
          </div>
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Nenhum veículo encontrado.
            </div>
          ) : (
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
                  {filtered.map((v) => (
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
  onSaved: () => void;
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !placa.trim()) {
      toast.error("Informe nome e placa");
      return;
    }
    const data = {
      uh: uh.trim(),
      nome: nome.trim(),
      carro: carro.trim(),
      cor: cor.trim(),
      placa: placa.trim().toUpperCase(),
      observacoes,
      autorizacoes: autorizacoes.trim(),
    };
    if (veiculo) {
      veiculosService.update(veiculo.id, data);
      toast.success("Veículo atualizado");
    } else {
      veiculosService.create(data);
      toast.success("Veículo cadastrado");
    }
    onSaved();
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
    onChange={(e) =>
      setObservacoes(e.target.value as ObservacaoVeiculo)
    }
    placeholder="Selecione ou digite o tipo"
  />

  <datalist id="tipos-veiculo">
    <option value="PROPRIETÁRIO" />
    <option value="PRESTADOR DE SERVIÇO" />
    <option value="GESTOR" />
    <option value="VISITANTE" />
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
          <Button type="submit" className="bg-gradient-to-r from-primary to-secondary">
            {veiculo ? "Salvar alterações" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
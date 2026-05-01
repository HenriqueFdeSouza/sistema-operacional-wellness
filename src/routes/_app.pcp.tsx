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
import { toast } from "sonner";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";
import { pcpService, type PCP } from "@/services/pcp";
import { formatDate, monthKey, monthLabel } from "@/lib/datetime";

export const Route = createFileRoute("/_app/pcp")({
  head: () => ({ meta: [{ title: "PCP — Wellness Control Hub" }] }),
  component: PCPPage,
});

function PCPPage() {
  const [items, setItems] = useState<PCP[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await pcpService.list();
      setItems(data);
    } catch (error) {
      toast.error("Erro ao carregar registros do PCP");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.nome.toLowerCase().includes(q) || i.produto.toLowerCase().includes(q),
    );
  }, [items, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, PCP[]>();
    filtered.forEach((p) => {
      const k = monthKey(p.data);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta retirada?")) return;

    try {
      await pcpService.remove(id);
      toast.success("Registro excluído");
      await refresh();
    } catch (error) {
      toast.error("Erro ao excluir registro");
    }
  };

  return (
    <>
      <TopBar
        title="PCP — Retirada de Produtos"
        description="Histórico de retiradas de produtos."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-secondary">
                <Plus className="h-4 w-4 mr-1" /> Nova retirada
              </Button>
            </DialogTrigger>
            <NovaPCPDialog
              onCreated={async () => {
                await refresh();
                setOpen(false);
              }}
            />
          </Dialog>
        }
      />
      <main className="flex-1 p-6 overflow-y-auto space-y-6">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <ShoppingCart className="h-5 w-5 text-secondary" />
          <Input
            placeholder="Buscar por nome ou produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <span className="ml-auto text-sm text-muted-foreground">
            {filtered.length} registro{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
            Carregando registros...
          </div>
        ) : grouped.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
            Nenhuma retirada registrada.
          </div>
        ) : (
          grouped.map(([month, list]) => (
            <div key={month} className="bg-card border border-border rounded-xl">
              <div className="px-4 py-3 border-b border-border bg-muted/40 rounded-t-xl flex items-center justify-between">
                <h3 className="font-display font-bold capitalize text-foreground">
                  {monthLabel(month)}
                </h3>
                <span className="text-xs text-muted-foreground">{list.length} item(s)</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Data</TableHead>
                    <TableHead className="w-48">Nome</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="w-16 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{formatDate(p.data)}</TableCell>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell>{p.produto}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))
        )}
      </main>
    </>
  );
}

function NovaPCPDialog({ onCreated }: { onCreated: () => Promise<void> }) {
  const [nome, setNome] = useState("");
  const [produto, setProduto] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !produto.trim()) {
      toast.error("Informe nome e produto");
      return;
    }

    try {
      setSaving(true);
      await pcpService.create({
        nome: nome.trim(),
        produto: produto.trim(),
      });

      toast.success("Retirada registrada");
      setNome("");
      setProduto("");
      await onCreated();
    } catch (error) {
      toast.error("Erro ao registrar retirada");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova retirada de produto</DialogTitle>
      </DialogHeader>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </div>

        <div className="space-y-2">
          <Label>Produto</Label>
          <Textarea
            value={produto}
            onChange={(e) => setProduto(e.target.value)}
            rows={3}
            placeholder="Descreva o produto retirado"
          />
        </div>

        <DialogFooter>
          <Button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            {saving ? "Registrando..." : "Registrar retirada"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  AlertTriangle,
  Ban,
  Check,
  ChevronDown,
  Clock3,
  Download,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  STATUS_ITEM_SEGURANCA,
  checklistSegurancaService,
  type ChecklistSeguranca,
  type StatusItemSeguranca,
  type TurnoSeguranca,
} from "@/services/checklist-seguranca";
import { dateKey } from "@/lib/datetime";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/seguranca-operacional")({
  head: () => ({ meta: [{ title: "Segurança Operacional — Wellness Control Hub" }] }),
  component: SegurancaOperacionalPage,
});

const POSTOS_SEGURANCA = [
  "PORTARIA PRAIA",
  "PORTARIA SOCIAL",
  "RONDANTE",
] as const;

const ITENS_CALCULO: Array<keyof Pick<
  ChecklistSeguranca,
  "cinco_s_postos" | "camera" | "radios" | "cancelas" | "alarme" | "status"
>> = ["cinco_s_postos", "camera", "radios", "cancelas", "alarme", "status"];

type CampoStatus = (typeof ITENS_CALCULO)[number];

type DraftRow = {
  agente: string;
  posto: string;
  cinco_s_postos: StatusItemSeguranca;
  camera: StatusItemSeguranca;
  radios: StatusItemSeguranca;
  cancelas: StatusItemSeguranca;
  alarme: StatusItemSeguranca;
  acao_corretiva: string;
  status: StatusItemSeguranca;
};

const emptyDraft = (): DraftRow => ({
  agente: "",
  posto: "",
  cinco_s_postos: "OK",
  camera: "OK",
  radios: "OK",
  cancelas: "OK",
  alarme: "OK",
  acao_corretiva: "",
  status: "OK",
});

const STATUS_UI: Record<
  StatusItemSeguranca,
  {
    label: string;
    description: string;
    dot: string;
    active: string;
    soft: string;
    icon: typeof Check;
  }
> = {
  OK: {
    label: "OK",
    description: "Conforme",
    dot: "bg-emerald-500",
    active: "bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/20",
    soft: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: Check,
  },
  P: {
    label: "P",
    description: "Pendente",
    dot: "bg-red-500",
    active: "bg-red-500 text-white border-red-500 shadow-red-500/20",
    soft: "bg-red-50 text-red-700 border-red-200",
    icon: AlertTriangle,
  },
  A: {
    label: "A",
    description: "Andamento",
    dot: "bg-amber-500",
    active: "bg-amber-500 text-white border-amber-500 shadow-amber-500/20",
    soft: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock3,
  },
  NSA: {
    label: "NSA",
    description: "Não se aplica",
    dot: "bg-blue-500",
    active: "bg-blue-500 text-white border-blue-500 shadow-blue-500/20",
    soft: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Ban,
  },
  NOK: {
    label: "NOK",
    description: "Não conforme",
    dot: "bg-rose-700",
    active: "bg-rose-700 text-white border-rose-700 shadow-rose-700/20",
    soft: "bg-rose-50 text-rose-800 border-rose-200",
    icon: XCircle,
  },
};

function todayInput() {
  const now = new Date();
  const off = now.getTimezoneOffset();
  const local = new Date(now.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function parseDateInput(date: string) {
  return `${date}T12:00:00.000`;
}

function getHorario(turno: TurnoSeguranca) {
  return turno === "DIURNO" ? "07:00/19:00" : "19:00/07:00";
}

function formatDateBr(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function calcularIndicadores(rows: ChecklistSeguranca[]) {
  let ok = 0;
  let total = 0;
  let pendentes = 0;
  let andamento = 0;
  let nsa = 0;
  let nok = 0;

  rows.forEach((row) => {
    ITENS_CALCULO.forEach((field) => {
      const value = row[field] as StatusItemSeguranca;

      if (value === "NSA") {
        nsa++;
        return;
      }

      total++;

      if (value === "OK") ok++;
      if (value === "P") pendentes++;
      if (value === "A") andamento++;
      if (value === "NOK") nok++;
    });
  });

  return {
    ok,
    total,
    pendentes,
    andamento,
    nsa,
    nok,
    percentual: total > 0 ? Math.round((ok / total) * 10000) / 100 : 0,
  };
}

function statusPdfColor(value: StatusItemSeguranca): [number, number, number] {
  switch (value) {
    case "OK":
      return [22, 163, 74];
    case "P":
      return [220, 38, 38];
    case "A":
      return [245, 158, 11];
    case "NSA":
      return [37, 99, 235];
    case "NOK":
      return [185, 28, 28];
    default:
      return [107, 114, 128];
  }
}

function gerarPdfChecklist({
  data,
  diurno,
  noturno,
}: {
  data: string;
  diurno: ChecklistSeguranca[];
  noturno: ChecklistSeguranca[];
}) {
  const todos = [...diurno, ...noturno];
  const indicadores = calcularIndicadores(todos);
  const doc = new jsPDF("landscape", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(16, 135, 59);
  doc.rect(0, 0, pageWidth, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CHECKLIST DE SEGURANÇA OPERACIONAL", pageWidth / 2, 10, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${formatDateBr(data)}`, 14, 18);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, pageWidth - 14, 18, {
    align: "right",
  });

  const cardsY = 31;
  const cardW = 64;
  const gap = 7;
  const startX = 14;

  const cards = [
    ["Itens OK", String(indicadores.ok), [22, 163, 74]],
    ["Total válido", String(indicadores.total), [126, 34, 206]],
    ["NSA", String(indicadores.nsa), [37, 99, 235]],
    [
      "Total geral",
      `${indicadores.percentual.toFixed(2)}%`,
      indicadores.percentual >= 90 ? [22, 163, 74] : [245, 158, 11],
    ],
  ] as const;

  cards.forEach(([label, value, color], index) => {
    const x = startX + index * (cardW + gap);
    doc.setDrawColor(220, 220, 230);
    doc.setFillColor(250, 250, 252);
    doc.roundedRect(x, cardsY, cardW, 22, 3, 3, "FD");

    doc.setTextColor(80, 80, 95);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(label, x + 4, cardsY + 7);

    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(value, x + 4, cardsY + 17);
  });

  let cursorY = 61;

  const drawTurno = (titulo: string, rows: ChecklistSeguranca[]) => {
    doc.setFillColor(16, 135, 59);
    doc.rect(14, cursorY, pageWidth - 28, 9, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(titulo, pageWidth / 2, cursorY + 6, { align: "center" });

    cursorY += 9;

    const body =
      rows.length > 0
        ? rows.map((row) => [
            row.horario,
            row.agente,
            row.posto,
            row.cinco_s_postos,
            row.camera,
            row.radios,
            row.cancelas,
            row.alarme,
            row.acao_corretiva || "-",
            row.status,
          ])
        : [["-", "SEM REGISTROS", "-", "-", "-", "-", "-", "-", "-", "-"]];

    autoTable(doc, {
      startY: cursorY,
      head: [[
        "Horário",
        "Agente",
        "Posto",
        "5S Postos",
        "Câmera",
        "Rádios",
        "Cancelas",
        "Alarme",
        "Ação corretiva",
        "Status",
      ]],
      body,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 7.5,
        cellPadding: 2,
        halign: "center",
        valign: "middle",
        lineColor: [210, 210, 220],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [235, 235, 242],
        textColor: [20, 20, 35],
        fontStyle: "bold",
      },
      columnStyles: {
        1: { fontStyle: "bold" },
        2: { fontStyle: "bold" },
        8: { halign: "left" },
      },
      didParseCell: (dataCell) => {
        if (dataCell.section !== "body") return;

        const statusColumns = [3, 4, 5, 6, 7, 9];
        if (statusColumns.includes(dataCell.column.index)) {
          const raw = String(dataCell.cell.raw || "") as StatusItemSeguranca;
          const color = statusPdfColor(raw);
          dataCell.cell.styles.fillColor = color;
          dataCell.cell.styles.textColor = [255, 255, 255];
          dataCell.cell.styles.fontStyle = "bold";
        }
      },
      margin: { left: 14, right: 14 },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 8;
  };

  drawTurno("PLANTÃO DIURNO", diurno);
  drawTurno("PLANTÃO NOTURNO", noturno);

  const footerY = doc.internal.pageSize.getHeight() - 22;

  doc.setFillColor(246, 246, 250);
  doc.roundedRect(14, footerY - 8, pageWidth - 28, 18, 3, 3, "F");

  doc.setTextColor(20, 20, 35);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Legenda:", 18, footerY - 1);

  const legendas = [
    ["P", "Pendente", [220, 38, 38]],
    ["A", "Andamento", [245, 158, 11]],
    ["OK", "OK", [22, 163, 74]],
    ["NSA", "Não se aplica", [37, 99, 235]],
  ] as const;

  let lx = 38;
  legendas.forEach(([sigla, label, color]) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(lx, footerY - 6, 13, 6, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(sigla, lx + 6.5, footerY - 2, { align: "center" });

    doc.setTextColor(20, 20, 35);
    doc.text(label, lx + 16, footerY - 2);
    lx += 50;
  });

  doc.setTextColor(100, 100, 110);
  doc.setFontSize(7);
  doc.text("Wellness Control Hub", pageWidth - 18, footerY + 5, { align: "right" });

  doc.save(`checklist-seguranca-operacional-${data}.pdf`);
}

function SegurancaOperacionalPage() {
  const [items, setItems] = useState<ChecklistSeguranca[]>([]);
  const [filterDate, setFilterDate] = useState(todayInput());
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await checklistSegurancaService.list();
      setItems(data);
    } catch (error) {
      toast.error("Erro ao carregar checklist de segurança");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(
    () => items.filter((i) => dateKey(i.data) === filterDate),
    [items, filterDate],
  );

  const diurno = filtered.filter((i) => i.turno === "DIURNO");
  const noturno = filtered.filter((i) => i.turno === "NOTURNO");
  const indicadores = calcularIndicadores(filtered);

  const updateRow = async (
    id: string,
    field: keyof ChecklistSeguranca,
    value: string,
  ) => {
    const original = items;
    const updated = items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item,
    );

    setItems(updated as ChecklistSeguranca[]);

    try {
      await checklistSegurancaService.update(id, { [field]: value } as Partial<ChecklistSeguranca>);
    } catch (error) {
      setItems(original);
      toast.error("Erro ao atualizar registro");
    }
  };

  return (
    <>
      <datalist id="postos-seguranca">
        {POSTOS_SEGURANCA.map((posto) => (
          <option key={posto} value={posto} />
        ))}
      </datalist>

      <TopBar
        title="Checklist de Segurança Operacional"
        description="Clique nos status para atualizar o cálculo automaticamente."
        actions={
          <Button
            onClick={() => gerarPdfChecklist({ data: filterDate, diurno, noturno })}
            className="bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/20"
          >
            <Download className="h-4 w-4 mr-1" />
            Baixar PDF
          </Button>
        }
      />

      <main className="flex-1 p-6 overflow-y-auto space-y-6">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap shadow-sm">
          <div className="flex items-center gap-2 font-semibold">
            <div className="h-9 w-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            Registros do dia
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Data</Label>
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-auto rounded-xl"
            />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          <CardIndicador label="Itens OK" value={indicadores.ok} tone="success" />
          <CardIndicador label="Total válido" value={indicadores.total} />
          <CardIndicador label="NSA" value={indicadores.nsa} tone="blue" />
          <CardIndicador
            label="Total geral"
            value={`${indicadores.percentual.toFixed(2)}%`}
            tone={indicadores.percentual >= 90 ? "success" : "warning"}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-5">
          {(Object.keys(STATUS_UI) as StatusItemSeguranca[]).map((status) => (
            <LegendaItem key={status} value={status} />
          ))}
        </div>

        {loading ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center text-sm text-muted-foreground">
            Carregando registros...
          </div>
        ) : (
          <>
            <ChecklistTable
              title="Plantão Diurno"
              turno="DIURNO"
              rows={diurno}
              filterDate={filterDate}
              onRefresh={refresh}
              onUpdate={updateRow}
            />
            <ChecklistTable
              title="Plantão Noturno"
              turno="NOTURNO"
              rows={noturno}
              filterDate={filterDate}
              onRefresh={refresh}
              onUpdate={updateRow}
            />
          </>
        )}
      </main>
    </>
  );
}

function CardIndicador({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "success" | "warning" | "blue";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600"
      : tone === "warning"
        ? "text-amber-500"
        : tone === "blue"
          ? "text-blue-600"
          : "text-secondary";

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`font-display text-3xl font-bold mt-1 ${toneClass}`}>{value}</p>
    </div>
  );
}

function LegendaItem({ value }: { value: StatusItemSeguranca }) {
  const config = STATUS_UI[value];
  const Icon = config.icon;

  return (
    <div className={cn("border rounded-2xl p-3 flex items-center gap-3 shadow-sm", config.soft)}>
      <span className={cn("h-8 w-8 rounded-xl flex items-center justify-center text-white", config.dot)}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-bold">{config.label}</p>
        <p className="text-[11px] opacity-80">{config.description}</p>
      </div>
    </div>
  );
}

function ChecklistTable({
  title,
  turno,
  rows,
  filterDate,
  onRefresh,
  onUpdate,
}: {
  title: string;
  turno: TurnoSeguranca;
  rows: ChecklistSeguranca[];
  filterDate: string;
  onRefresh: () => Promise<void>;
  onUpdate: (id: string, field: keyof ChecklistSeguranca, value: string) => Promise<void>;
}) {
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const horario = getHorario(turno);

  const addDraft = () => setDrafts((current) => [...current, emptyDraft()]);

  const saveDraft = async (index: number) => {
    const draft = drafts[index];

    if (!draft.agente.trim() || !draft.posto.trim()) {
      toast.error("Informe agente e posto");
      return;
    }

    try {
      await checklistSegurancaService.create({
        data: parseDateInput(filterDate),
        turno,
        horario,
        agente: draft.agente.trim().toUpperCase(),
        posto: draft.posto.trim().toUpperCase(),
        cinco_s_postos: draft.cinco_s_postos,
        camera: draft.camera,
        radios: draft.radios,
        cancelas: draft.cancelas,
        alarme: draft.alarme,
        acao_corretiva: draft.acao_corretiva.trim().toUpperCase(),
        status: draft.status,
      });

      toast.success("Linha salva");
      setDrafts((current) => current.map((item, i) => (i === index ? emptyDraft() : item)));
      await onRefresh();
    } catch (error) {
      toast.error("Erro ao salvar linha");
    }
  };

  const deleteRow = async (id: string) => {
    if (!confirm("Excluir esta linha?")) return;

    try {
      await checklistSegurancaService.remove(id);
      toast.success("Linha excluída");
      await onRefresh();
    } catch (error) {
      toast.error("Erro ao excluir linha");
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-4 text-center font-display font-bold uppercase tracking-wide">
        {title}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Horário</TableHead>
              <TableHead>Agente</TableHead>
              <TableHead>Posto</TableHead>
              <TableHead>5S Postos</TableHead>
              <TableHead>Câmera</TableHead>
              <TableHead>Rádios</TableHead>
              <TableHead>Cancelas</TableHead>
              <TableHead>Alarme</TableHead>
              <TableHead>Ação corretiva</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-xs">{row.horario}</TableCell>
                <TableCell>
                  <Input
                    value={row.agente}
                    onChange={(e) => onUpdate(row.id, "agente", e.target.value.toUpperCase())}
                    className="h-9 min-w-32 rounded-xl border-muted bg-background shadow-sm"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    list="postos-seguranca"
                    value={row.posto}
                    onChange={(e) => onUpdate(row.id, "posto", e.target.value.toUpperCase())}
                    className="h-9 min-w-36 rounded-xl border-muted bg-background shadow-sm"
                  />
                </TableCell>
                <StatusSelectCell row={row} field="cinco_s_postos" onUpdate={onUpdate} />
                <StatusSelectCell row={row} field="camera" onUpdate={onUpdate} />
                <StatusSelectCell row={row} field="radios" onUpdate={onUpdate} />
                <StatusSelectCell row={row} field="cancelas" onUpdate={onUpdate} />
                <StatusSelectCell row={row} field="alarme" onUpdate={onUpdate} />
                <TableCell>
                  <Input
                    value={row.acao_corretiva}
                    onChange={(e) =>
                      onUpdate(row.id, "acao_corretiva", e.target.value.toUpperCase())
                    }
                    placeholder="-"
                    className="h-9 min-w-40 rounded-xl border-muted bg-background shadow-sm"
                  />
                </TableCell>
                <StatusSelectCell row={row} field="status" onUpdate={onUpdate} />
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => deleteRow(row.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {drafts.map((draft, index) => (
              <TableRow key={`draft-${turno}-${index}`} className="bg-muted/20">
                <TableCell className="font-mono text-xs">{horario}</TableCell>
                <TableCell>
                  <Input
                    value={draft.agente}
                    onChange={(e) =>
                      setDrafts((current) =>
                        current.map((item, i) =>
                          i === index ? { ...item, agente: e.target.value.toUpperCase() } : item,
                        ),
                      )
                    }
                    placeholder="AGENTE"
                    className="h-9 min-w-32 rounded-xl border-muted bg-background shadow-sm"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    list="postos-seguranca"
                    value={draft.posto}
                    onChange={(e) =>
                      setDrafts((current) =>
                        current.map((item, i) =>
                          i === index ? { ...item, posto: e.target.value.toUpperCase() } : item,
                        ),
                      )
                    }
                    placeholder="POSTO"
                    className="h-9 min-w-36 rounded-xl border-muted bg-background shadow-sm"
                  />
                </TableCell>

                <DraftStatusCell drafts={drafts} setDrafts={setDrafts} index={index} field="cinco_s_postos" />
                <DraftStatusCell drafts={drafts} setDrafts={setDrafts} index={index} field="camera" />
                <DraftStatusCell drafts={drafts} setDrafts={setDrafts} index={index} field="radios" />
                <DraftStatusCell drafts={drafts} setDrafts={setDrafts} index={index} field="cancelas" />
                <DraftStatusCell drafts={drafts} setDrafts={setDrafts} index={index} field="alarme" />

                <TableCell>
                  <Input
                    value={draft.acao_corretiva}
                    onChange={(e) =>
                      setDrafts((current) =>
                        current.map((item, i) =>
                          i === index
                            ? { ...item, acao_corretiva: e.target.value.toUpperCase() }
                            : item,
                        ),
                      )
                    }
                    placeholder="-"
                    className="h-9 min-w-40 rounded-xl border-muted bg-background shadow-sm"
                  />
                </TableCell>

                <DraftStatusCell drafts={drafts} setDrafts={setDrafts} index={index} field="status" />

                <TableCell className="text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Salvar linha"
                    onClick={() => saveDraft(index)}
                  >
                    <Save className="h-4 w-4 text-emerald-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="border-t border-border p-3">
        <Button type="button" variant="outline" size="sm" onClick={addDraft} className="rounded-xl">
          <Plus className="h-4 w-4 mr-1" />
          Adicionar linha no {title.toLowerCase()}
        </Button>
      </div>
    </div>
  );
}

function StatusSelectCell({
  row,
  field,
  onUpdate,
}: {
  row: ChecklistSeguranca;
  field: CampoStatus;
  onUpdate: (id: string, field: keyof ChecklistSeguranca, value: string) => Promise<void>;
}) {
  const value = row[field] as StatusItemSeguranca;

  return (
    <TableCell className="min-w-[86px]">
      <StatusSelector value={value} onChange={(next) => onUpdate(row.id, field, next)} />
    </TableCell>
  );
}

function DraftStatusCell({
  drafts,
  setDrafts,
  index,
  field,
}: {
  drafts: DraftRow[];
  setDrafts: Dispatch<SetStateAction<DraftRow[]>>;
  index: number;
  field: CampoStatus;
}) {
  const value = drafts[index][field] as StatusItemSeguranca;

  return (
    <TableCell className="min-w-[86px]">
      <StatusSelector
        value={value}
        onChange={(next) =>
          setDrafts((current) =>
            current.map((item, i) => (i === index ? { ...item, [field]: next } : item)),
          )
        }
      />
    </TableCell>
  );
}

function StatusSelector({
  value,
  onChange,
}: {
  value: StatusItemSeguranca;
  onChange: (value: StatusItemSeguranca) => void;
}) {
  const config = STATUS_UI[value];
  const Icon = config.icon;

  return (
    <Select value={value} onValueChange={(next) => onChange(next as StatusItemSeguranca)}>
      <SelectTrigger
        className={cn(
          "h-8 w-[78px] rounded-xl border px-2 shadow-sm [&>svg]:hidden",
          config.active,
        )}
      >
        <div className="flex w-full items-center justify-between gap-1">
          <span className="flex items-center gap-1 text-xs font-bold">
            <Icon className="h-3.5 w-3.5" />
            {config.label}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-80" />
        </div>
      </SelectTrigger>

      <SelectContent align="center" className="min-w-[170px] rounded-xl">
        {STATUS_ITEM_SEGURANCA.map((status: StatusItemSeguranca) => {
          const option = STATUS_UI[status];
          const OptionIcon = option.icon;

          return (
            <SelectItem key={status} value={status} className="cursor-pointer rounded-lg">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-9 items-center justify-center rounded-lg text-xs font-bold text-white",
                    option.dot,
                  )}
                >
                  {option.label}
                </span>
                <span className="text-xs font-medium">{option.description}</span>
                <OptionIcon className="ml-auto h-3.5 w-3.5 opacity-70" />
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

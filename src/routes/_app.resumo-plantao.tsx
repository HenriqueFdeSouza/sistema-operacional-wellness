import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertTriangle,
  Download,
  FileText,
  KeyRound,
  Lock,
  Package,
  Radio,
  ShieldCheck,
  Wrench,
  Car,
} from "lucide-react";
import {
  resumoPlantaoService,
  type CcrResumo,
  type ChaveResumo,
  type ChecklistResumo,
  type MestraResumo,
  type RadioResumo,
  type ResumoPlantao,
} from "@/services/resumo-plantao";

export const Route = createFileRoute("/_app/resumo-plantao")({
  head: () => ({ meta: [{ title: "Resumo do Plantão — Wellness Control Hub" }] }),
  component: ResumoPlantaoPage,
});

function todayInput() {
  const now = new Date();
  const off = now.getTimezoneOffset();
  const local = new Date(now.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function formatDateBr(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
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

function formatDateTimeLong(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function periodoOperacionalTexto(resumo: ResumoPlantao) {
  return `${formatDateBr(resumo.periodo.data)} — 00:00 às 23:59`;
}

function mensagemPendenciaOperacional(
  tipo: "Rádio" | "Chave" | "Chave mestra",
  saida: string | null,
  resumo: ResumoPlantao,
) {
  const saidaTexto = formatDateTimeLong(saida);

  if (tipo === "Rádio") {
    return `Entregue na data ${formatDateBr(resumo.periodo.data)} às ${saidaTexto} e ainda não possui retorno registrado.`;
  }

  if (tipo === "Chave") {
    return `Retirada na data ${formatDateBr(resumo.periodo.data)} às ${saidaTexto} e ainda não possui retorno registrado.`;
  }

  return `Retirada na data ${formatDateBr(resumo.periodo.data)} às ${saidaTexto} e ainda não possui retorno registrado.`;
}

function isAberto(retorno: string | null) {
  return !retorno;
}

function calcChecklist(checklist: ChecklistResumo[]) {
  const fields: Array<keyof ChecklistResumo> = [
    "cinco_s_postos",
    "camera",
    "radios",
    "cancelas",
    "alarme",
    "status",
  ];

  let ok = 0;
  let total = 0;
  let nsa = 0;
  let pendencias = 0;

  checklist.forEach((item) => {
    fields.forEach((field) => {
      const value = String(item[field] ?? "").toUpperCase();

      if (value === "NSA") {
        nsa++;
        return;
      }

      total++;

      if (value === "OK") ok++;
      if (value === "P" || value === "A" || value === "NOK") pendencias++;
    });
  });

  return {
    ok,
    total,
    nsa,
    pendencias,
    percentual: total > 0 ? Math.round((ok / total) * 10000) / 100 : 0,
  };
}


function calcCcr(ccr: CcrResumo[]) {
  const fields: Array<keyof CcrResumo> = [
    "controle_acesso",
    "cameras",
    "radios",
    "cancelas",
    "alarme",
    "status",
  ];

  let ok = 0;
  let total = 0;
  let nsa = 0;
  let pendencias = 0;

  ccr.forEach((item) => {
    fields.forEach((field) => {
      const value = String(item[field] ?? "").toUpperCase();

      if (value === "NSA") {
        nsa++;
        return;
      }

      if (!value || value === "-") return;

      total++;

      if (value === "OK") ok++;
      if (value === "P" || value === "A" || value === "NOK") pendencias++;
    });
  });

  return {
    ok,
    total,
    nsa,
    pendencias,
    percentual: total > 0 ? Math.round((ok / total) * 10000) / 100 : 0,
  };
}

function agentesCcrTexto(item: CcrResumo) {
  return item.agentes
    .filter((agente) => agente.nome || agente.posto)
    .map((agente) => `${agente.nome || "-"} — ${agente.posto || "-"}`)
    .join("\\n");
}

function pctColor(value: number): [number, number, number] {
  if (value >= 90) return [22, 163, 74];
  if (value >= 70) return [245, 158, 11];
  return [220, 38, 38];
}

function addHeader(doc: jsPDF, resumo: ResumoPlantao) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(88, 28, 135);
  doc.rect(0, 0, pageWidth, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("RESUMO DO PLANTÃO", pageWidth / 2, 10, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Data analisada: ${periodoOperacionalTexto(resumo)}`, 14, 18);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, pageWidth - 14, 18, {
    align: "right",
  });
}

function addSectionTitle(doc: jsPDF, title: string, y: number, color: [number, number, number] = [88, 28, 135]) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(14, y, pageWidth - 28, 8, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(title, 18, y + 5.5);

  return y + 10;
}

function gerarPdfResumo(resumo: ResumoPlantao, observacao: string) {
  const doc = new jsPDF("portrait", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const radiosNaoDevolvidos = resumo.radios.filter((r) => isAberto(r.retorno));
  const radiosDevolvidos = resumo.radios.filter((r) => !isAberto(r.retorno));

  const chavesNaoDevolvidas = resumo.chaves.filter((c) => isAberto(c.retorno));
  const chavesDevolvidas = resumo.chaves.filter((c) => !isAberto(c.retorno));

  const mestrasNaoDevolvidas = resumo.mestras.filter((m) => isAberto(m.retorno));
  const mestrasDevolvidas = resumo.mestras.filter((m) => !isAberto(m.retorno));

  const checklist = calcChecklist(resumo.checklist);
  const ccr = calcCcr(resumo.ccr);
  const totalNaoDevolvidos =
    radiosNaoDevolvidos.length + chavesNaoDevolvidas.length + mestrasNaoDevolvidas.length;

  const ensureSpace = (needed = 45) => {
    if (y > pageHeight - needed) {
      doc.addPage();
      addHeader(doc, resumo);
      y = 32;
    }
  };

  const tableTheme = {
    theme: "grid" as const,
    margin: { left: 14, right: 14 },
    styles: {
      fontSize: 6.8,
      cellPadding: 1.7,
      lineColor: [220, 220, 230] as [number, number, number],
      lineWidth: 0.2,
      textColor: [20, 20, 35] as [number, number, number],
    },
  };

  addHeader(doc, resumo);

  let y = 32;

  const cards = [
    ["Rádios", `${resumo.radios.length}`, `${radiosNaoDevolvidos.length} não devolvido(s)`],
    ["Chaves", `${resumo.chaves.length}`, `${chavesNaoDevolvidas.length} não devolvida(s)`],
    ["Mestras", `${resumo.mestras.length}`, `${mestrasNaoDevolvidas.length} não devolvida(s)`],
    ["CCR", `${ccr.percentual.toFixed(2)}%`, `${ccr.pendencias} pendência(s)`],
  ];

  cards.forEach((card, index) => {
    const x = 14 + index * 46;
    doc.setDrawColor(220, 220, 230);
    doc.setFillColor(250, 250, 252);
    doc.roundedRect(x, y, 42, 20, 3, 3, "FD");

    doc.setTextColor(80, 80, 95);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(card[0], x + 3, y + 6);

    const isAlertCard = card[2].startsWith("0 ") === false && card[0] !== "Checklist";
    const color =
      card[0] === "CCR"
        ? pctColor(ccr.percentual)
        : isAlertCard
          ? ([220, 38, 38] as [number, number, number])
          : ([88, 28, 135] as [number, number, number]);

    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(card[1], x + 3, y + 13);

    doc.setTextColor(120, 120, 130);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text(card[2], x + 3, y + 18);
  });

  y += 28;

  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(14, y, pageWidth - 28, 18, 3, 3, "FD");
  doc.setTextColor(30, 64, 175);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("DATA ANALISADA", 18, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(periodoOperacionalTexto(resumo), 18, y + 13);
  doc.setTextColor(80, 80, 95);
  doc.text("Pendências indicam itens sem retorno registrado, mesmo que sejam devolvidos depois.", pageWidth - 18, y + 13, {
    align: "right",
  });
  y += 26;

  y = addSectionTitle(
    doc,
    "RÁDIOS, CHAVES E CHAVES MESTRAS AINDA NÃO DEVOLVIDAS",
    y,
    totalNaoDevolvidos > 0 ? [220, 38, 38] : [22, 163, 74],
  );

  const naoDevolvidos = [
    ...radiosNaoDevolvidos.map((r) => [
      "Rádio",
      r.colaborador,
      r.id_radio,
      r.setor,
      formatDateTime(r.saida),
      `Saída em ${formatDateBr(resumo.periodo.data)}`,
      "NÃO DEVOLVIDO",
      mensagemPendenciaOperacional("Rádio", r.saida, resumo),
    ]),
    ...chavesNaoDevolvidas.map((c) => [
      "Chave",
      c.colaborador,
      c.chave,
      c.setor,
      formatDateTime(c.saida),
      `Saída em ${formatDateBr(resumo.periodo.data)}`,
      "NÃO DEVOLVIDA",
      mensagemPendenciaOperacional("Chave", c.saida, resumo),
    ]),
    ...mestrasNaoDevolvidas.map((m) => [
      `Mestra ${m.origem}`,
      m.colaborador,
      "-",
      m.setor,
      formatDateTime(m.saida),
      `Saída em ${formatDateBr(resumo.periodo.data)}`,
      "NÃO DEVOLVIDA",
      mensagemPendenciaOperacional("Chave mestra", m.saida, resumo),
    ]),
  ];

  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [["Tipo", "Responsável", "Item", "Setor", "Saída", "Origem", "Situação", "Observação operacional"]],
    body: naoDevolvidos.length
      ? naoDevolvidos
      : [["Sem pendências", "Tudo devolvido no plantão", "-", "-", "-", "-", "OK", "Todos os itens foram devolvidos até o fechamento operacional."]],
    headStyles: {
      fillColor: totalNaoDevolvidos > 0 ? [254, 226, 226] : [220, 252, 231],
      textColor: totalNaoDevolvidos > 0 ? [127, 29, 29] : [20, 83, 45],
      fontStyle: "bold",
    },
    columnStyles: {
      7: { cellWidth: 48, halign: "left" },
      5: { cellWidth: 26 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 6) {
        if (String(data.cell.raw).includes("NÃO")) {
          data.cell.styles.fillColor = [254, 226, 226];
          data.cell.styles.textColor = [153, 27, 27];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.fillColor = [220, 252, 231];
          data.cell.styles.textColor = [20, 83, 45];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  ensureSpace();

  y = addSectionTitle(doc, "RÁDIOS DEVOLVIDOS", y, [22, 163, 74]);
  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [["Colaborador", "Rádio", "Setor", "Saída", "Retorno", "Status"]],
    body: radiosDevolvidos.length
      ? radiosDevolvidos.map((r) => [
          r.colaborador,
          r.id_radio,
          r.setor,
          formatDateTime(r.saida),
          formatDateTime(r.retorno),
          "DEVOLVIDO",
        ])
      : [["Sem rádios devolvidos neste plantão", "-", "-", "-", "-", "-"]],
    headStyles: { fillColor: [220, 252, 231], textColor: [20, 83, 45], fontStyle: "bold" },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5 && data.cell.raw === "DEVOLVIDO") {
        data.cell.styles.fillColor = [220, 252, 231];
        data.cell.styles.textColor = [20, 83, 45];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  ensureSpace();

  y = addSectionTitle(doc, "CHAVES DEVOLVIDAS", y, [22, 163, 74]);
  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [["Chave", "Colaborador", "Setor", "Saída", "Retorno", "Agente recebeu"]],
    body: chavesDevolvidas.length
      ? chavesDevolvidas.map((c) => [
          c.chave,
          c.colaborador,
          c.setor,
          formatDateTime(c.saida),
          formatDateTime(c.retorno),
          c.agente_recebeu || "-",
        ])
      : [["Sem chaves devolvidas neste plantão", "-", "-", "-", "-", "-"]],
    headStyles: { fillColor: [220, 252, 231], textColor: [20, 83, 45], fontStyle: "bold" },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  ensureSpace();

  y = addSectionTitle(doc, "CHAVES MESTRAS DEVOLVIDAS", y, [22, 163, 74]);
  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [["Tipo", "Colaborador", "Setor", "Saída", "Retorno", "Agente recebeu"]],
    body: mestrasDevolvidas.length
      ? mestrasDevolvidas.map((m) => [
          `Mestra ${m.origem}`,
          m.colaborador,
          m.setor,
          formatDateTime(m.saida),
          formatDateTime(m.retorno),
          m.agente_recebeu || "-",
        ])
      : [["Sem chaves mestras devolvidas neste plantão", "-", "-", "-", "-", "-"]],
    headStyles: { fillColor: [220, 252, 231], textColor: [20, 83, 45], fontStyle: "bold" },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  ensureSpace(70);

  y = addSectionTitle(doc, "CCR FEITO NO PLANTÃO", y, [16, 135, 59]);

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, y, pageWidth - 28, 16, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(20, 83, 45);
  doc.text(`Itens OK: ${ccr.ok}`, 18, y + 6);
  doc.text(`Itens avaliados: ${ccr.total}`, 58, y + 6);
  doc.text(`NSA: ${ccr.nsa}`, 108, y + 6);

  const c = pctColor(ccr.percentual);
  doc.setTextColor(c[0], c[1], c[2]);
  doc.setFontSize(11);
  doc.text(`Total geral: ${ccr.percentual.toFixed(2)}%`, pageWidth - 18, y + 6, {
    align: "right",
  });

  doc.setFontSize(7);
  doc.setTextColor(80, 80, 95);
  doc.text(`Pendências no CCR: ${ccr.pendencias}`, 18, y + 12);

  y += 20;

  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [["Horário", "Agentes / Postos", "Controle", "Câmeras", "Rádios", "Cancelas", "Alarme", "Ação", "Status"]],
    body: resumo.ccr.length
      ? resumo.ccr.map((item) => [
          item.horario,
          agentesCcrTexto(item),
          item.controle_acesso,
          item.cameras,
          item.radios,
          item.cancelas,
          item.alarme,
          item.acao_corretiva || "-",
          item.status || "-",
        ])
      : [["Sem CCR feito neste plantão", "-", "-", "-", "-", "-", "-", "-", "-"]],
    styles: { ...tableTheme.styles, fontSize: 6.5, cellPadding: 1.5, halign: "center" },
    columnStyles: {
      1: { halign: "left", cellWidth: 45 },
      7: { halign: "left" },
    },
    headStyles: { fillColor: [220, 252, 231], textColor: [20, 83, 45], fontStyle: "bold" },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const statusColumns = [2, 3, 4, 5, 6, 8];

      if (statusColumns.includes(data.column.index)) {
        const raw = String(data.cell.raw ?? "").toUpperCase();

        if (raw === "OK") {
          data.cell.styles.fillColor = [220, 252, 231];
          data.cell.styles.textColor = [20, 83, 45];
          data.cell.styles.fontStyle = "bold";
        }

        if (raw === "P" || raw === "NOK") {
          data.cell.styles.fillColor = [254, 226, 226];
          data.cell.styles.textColor = [153, 27, 27];
          data.cell.styles.fontStyle = "bold";
        }

        if (raw === "A") {
          data.cell.styles.fillColor = [254, 243, 199];
          data.cell.styles.textColor = [146, 64, 14];
          data.cell.styles.fontStyle = "bold";
        }

        if (raw === "NSA") {
          data.cell.styles.fillColor = [219, 234, 254];
          data.cell.styles.textColor = [30, 64, 175];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  ensureSpace();

  const movimentos = [
    ...resumo.pcp.map((p) => ["PCP", p.nome, p.produto, formatDateTime(p.created_at)]),
    ...resumo.veiculos.map((v) => ["Veículo", v.nome, `${v.placa} | UH ${v.uh}`, formatDateTime(v.created_at)]),
    ...resumo.armarios.map((a) => ["Armário", a.nome_colaborador, `${a.genero} Nº ${a.numero} | ${a.termo}`, formatDateTime(a.created_at)]),
  ];

  y = addSectionTitle(doc, "OUTROS MOVIMENTOS DO PLANTÃO", y, [88, 28, 135]);
  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head: [["Módulo", "Responsável", "Descrição", "Horário"]],
    body: movimentos.length ? movimentos : [["Sem registros", "-", "-", "-"]],
    headStyles: { fillColor: [241, 245, 249], textColor: [20, 20, 35], fontStyle: "bold" },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  if (observacao.trim()) {
    ensureSpace(40);
    y = addSectionTitle(doc, "OBSERVAÇÃO DO PLANTÃO", y, [88, 28, 135]);
    doc.setDrawColor(220, 220, 230);
    doc.setFillColor(250, 250, 252);
    doc.roundedRect(14, y, pageWidth - 28, 24, 3, 3, "FD");
    doc.setTextColor(20, 20, 35);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(observacao.trim(), pageWidth - 36), 18, y + 6);
  }

  const totalPages = (doc as any).internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 130);
    doc.text("Wellness Control Hub", pageWidth - 14, pageHeight - 8, { align: "right" });
    doc.text(`Página ${i} de ${totalPages}`, 14, pageHeight - 8);
  }

  doc.save(`resumo-plantao-${resumo.periodo.turno.toLowerCase()}-${resumo.periodo.data}.pdf`);
}

function ResumoPlantaoPage() {
  const [data, setData] = useState(todayInput());
  const [observacao, setObservacao] = useState("");
  const [resumo, setResumo] = useState<ResumoPlantao | null>(null);
  const [loading, setLoading] = useState(false);

  const indicadores = useMemo(() => {
    if (!resumo) {
      return null;
    }

    const radiosPendentes = resumo.radios.filter((r) => isAberto(r.retorno)).length;
    const chavesPendentes = resumo.chaves.filter((c) => isAberto(c.retorno)).length;
    const mestrasPendentes = resumo.mestras.filter((m) => isAberto(m.retorno)).length;
    const checklist = calcChecklist(resumo.checklist);

    return {
      radiosPendentes,
      chavesPendentes,
      mestrasPendentes,
      checklist,
      totalPendencias: radiosPendentes + chavesPendentes + mestrasPendentes + checklist.pendencias,
    };
  }, [resumo]);

  const carregar = async () => {
    try {
      setLoading(true);
      const dataResumo = await resumoPlantaoService.getResumo(data);
      setResumo(dataResumo);
      toast.success("Resumo carregado");
    } catch (error) {
      toast.error("Erro ao carregar resumo do plantão");
    } finally {
      setLoading(false);
    }
  };

  const baixarPdf = () => {
    if (!resumo) {
      toast.error("Carregue o resumo antes de baixar o PDF");
      return;
    }

    gerarPdfResumo(resumo, observacao);
  };

  return (
    <>
      <TopBar
        title="Resumo do Plantão"
        description="Gere um PDF compacto com tudo que teve saída na data selecionada."
        actions={
          <Button
            onClick={baixarPdf}
            disabled={!resumo}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            <Download className="h-4 w-4 mr-1" />
            Baixar PDF
          </Button>
        }
      />

      <main className="flex-1 p-6 overflow-y-auto space-y-6">
        <div className="bg-card border border-border rounded-2xl p-4 grid gap-4 lg:grid-cols-[1fr_1.4fr_auto] items-end">
          <div className="space-y-2">
            <Label>Data inicial do plantão</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Período do resumo</Label>
            <div className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center">
              DIA COMPLETO — {resumo ? periodoOperacionalTexto(resumo) : "00:00 às 23:59"}
            </div>
          </div>

          <Button onClick={carregar} disabled={loading} className="bg-gradient-to-r from-primary to-secondary">
            <FileText className="h-4 w-4 mr-1" />
            {loading ? "Carregando..." : "Gerar resumo"}
          </Button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <Label>Observação geral do plantão</Label>
          <Input
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: Plantão sem alterações relevantes, pendências repassadas ao próximo turno..."
          />
        </div>

        {resumo && indicadores && (
          <>
            <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl p-4">
              <p className="font-bold">Data analisada</p>
              <p className="text-sm">
                Este resumo considera somente os registros com saída na data selecionada: {periodoOperacionalTexto(resumo)}.
                Se o item tiver retorno registrado, ele aparece como devolvido, mesmo que tenha sido devolvido depois.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-4">
              <ResumoCard icon={Radio} label="Rádios" value={resumo.radios.length} detail={`${indicadores.radiosPendentes} pendente(s)`} warning={indicadores.radiosPendentes > 0} />
              <ResumoCard icon={KeyRound} label="Chaves" value={resumo.chaves.length} detail={`${indicadores.chavesPendentes} aberta(s)`} warning={indicadores.chavesPendentes > 0} />
              <ResumoCard icon={Wrench} label="Mestras" value={resumo.mestras.length} detail={`${indicadores.mestrasPendentes} aberta(s)`} warning={indicadores.mestrasPendentes > 0} />
              <ResumoCard icon={ShieldCheck} label="CCR" value={resumo.ccr.length} detail={`${resumo.ccr.length} registro(s) feito(s)`} warning={false} />
            </div>

            {indicadores.totalPendencias > 0 ? (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-bold">Atenção: existem pendências no plantão.</p>
                  <p className="text-sm">
                    As pendências abaixo são itens com saída na data selecionada que ainda não possuem retorno registrado.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4">
                <p className="font-bold">Sem pendências críticas identificadas no resumo carregado.</p>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <PreviewBox
                title="Rádios pendentes"
                icon={Radio}
                items={resumo.radios
                  .filter((r) => isAberto(r.retorno))
                  .map((r) => `${r.colaborador} — rádio ${r.id_radio} — ${r.setor} | ${mensagemPendenciaOperacional("Rádio", r.saida, resumo)}`)}
              />
              <PreviewBox
                title="Chaves abertas"
                icon={KeyRound}
                items={[
                  ...resumo.chaves
                    .filter((c) => isAberto(c.retorno))
                    .map((c) => `${c.colaborador} — chave ${c.chave} — ${c.setor} | ${mensagemPendenciaOperacional("Chave", c.saida, resumo)}`),
                  ...resumo.mestras
                    .filter((m) => isAberto(m.retorno))
                    .map((m) => `${m.colaborador} — mestra ${m.origem} — ${m.setor} | ${mensagemPendenciaOperacional("Chave mestra", m.saida, resumo)}`),
                ]}
              />
              <PreviewBox
                title="PCP / Produtos"
                icon={Package}
                items={resumo.pcp.map((p) => `${p.nome} — ${p.produto}`)}
              />
              <PreviewBox
                title="Veículos e Armários alterados"
                icon={Car}
                items={[
                  ...resumo.veiculos.map((v) => `${v.nome} — ${v.placa} — UH ${v.uh}`),
                  ...resumo.armarios.map((a) => `${a.nome_colaborador} — armário ${a.genero} Nº ${a.numero} — ${a.termo}`),
                ]}
              />
            </div>
          </>
        )}
      </main>
    </>
  );
}

function ResumoCard({
  icon: Icon,
  label,
  value,
  detail,
  warning,
}: {
  icon: typeof Radio;
  label: string;
  value: number | string;
  detail: string;
  warning?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 text-secondary" />
        {label}
      </div>
      <p className={`font-display text-3xl font-bold mt-2 ${warning ? "text-warning" : "text-secondary"}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{detail}</p>
    </div>
  );
}

function PreviewBox({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof Radio;
  items: string[];
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 font-semibold mb-3">
        <Icon className="h-4 w-4 text-secondary" />
        {title}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem registros.</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 8).map((item, index) => (
            <li key={`${item}-${index}`} className="text-sm border-b border-border/60 pb-2 last:border-0">
              {item}
            </li>
          ))}
          {items.length > 8 && (
            <li className="text-xs text-muted-foreground">+ {items.length - 8} registro(s) no PDF.</li>
          )}
        </ul>
      )}
    </div>
  );
}

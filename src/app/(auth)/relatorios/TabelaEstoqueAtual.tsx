"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { EstoqueAtualRow, Movimentacao } from "@/types";
import { formatarMoeda } from "@/lib/utils";
import ValorPrivado from "@/components/shared/ValorPrivado";

type Props = {
  rows: EstoqueAtualRow[];
  movimentacoes: Movimentacao[];
  podeFechamento: boolean;
  capacidadeArmazem: number;
  tenantNome: string;
};

function gerarPDF(rows: EstoqueAtualRow[], valorTotal: number, totalPaletes: number) {
  import("jspdf").then(({ default: jsPDF }) => {
    import("jspdf-autotable").then(({ default: autoTable }) => { try {
      const doc = new jsPDF({ orientation: "landscape" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const hoje = new Date().toLocaleDateString("pt-BR");

      // Fundo escuro na pagina inteira
      doc.setFillColor(9, 9, 11);
      doc.rect(0, 0, pageW, pageH, "F");

      // Faixa do header
      doc.setFillColor(18, 18, 21);
      doc.rect(0, 0, pageW, 28, "F");

      // Linha de destaque indigo abaixo do header
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 28, pageW, 1, "F");

      // Logo / titulo
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("FlowStock", 14, 13);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(113, 113, 122);
      doc.text("Relatório de Estoque", 14, 21);

      // Data alinhada a direita
      doc.setFontSize(9);
      doc.setTextColor(113, 113, 122);
      doc.text(`Gerado em ${hoje}`, pageW - 14, 17, { align: "right" });

      autoTable(doc, {
        startY: 34,
        margin: { left: 14, right: 14 },
        head: [["Produto", "Categoria", "Un.", "Estoque Atual", "Paletes", "Mín.", "Preço Custo", "Valor em Estoque", "Status"]],
        body: rows.map((r) => [
          r.nome,
          r.categoria ?? "—",
          r.unidade,
          r.estoque_atual.toLocaleString("pt-BR"),
          r.caixas_por_palete && r.estoque_atual > 0
            ? Number((r.estoque_atual / r.caixas_por_palete).toFixed(1)).toLocaleString("pt-BR") + " paletes"
            : "—",
          r.estoque_minimo.toLocaleString("pt-BR"),
          formatarMoeda(r.preco_custo),
          formatarMoeda(r.estoque_atual * r.preco_custo),
          r.estoque_atual <= r.estoque_minimo ? "Baixo" : "Ok",
        ]),
        headStyles: {
          fillColor: [24, 24, 27],
          textColor: [113, 113, 122],
          fontSize: 7.5,
          fontStyle: "bold",
          cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [212, 212, 216],
          fillColor: [9, 9, 11],
          cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
        },
        footStyles: {
          fillColor: [18, 18, 21],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
          cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
        },
        alternateRowStyles: { fillColor: [18, 18, 21] },
        tableLineColor: [39, 39, 42],
        tableLineWidth: 0.1,
        tableWidth: "auto",
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 22 },
          2: { cellWidth: 14 },
          3: { cellWidth: 26, halign: "right" },
          4: { cellWidth: 28, halign: "right" },
          5: { cellWidth: 16, halign: "right" },
          6: { cellWidth: 27, halign: "right" },
          7: { cellWidth: 48, halign: "right" },
          8: { cellWidth: 18, halign: "center" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 8) {
            const val = data.cell.raw as string;
            if (val === "Baixo") data.cell.styles.textColor = [248, 113, 113];
          }
          if (data.section === "body" && data.column.index === 3) {
            const row = rows[data.row.index];
            if (row && row.estoque_atual <= row.estoque_minimo) {
              data.cell.styles.textColor = [248, 113, 113];
            }
          }
        },
      });

      // Rodape da pagina
      doc.setFontSize(7.5);
      doc.setTextColor(63, 63, 70);
      doc.setFont("helvetica", "normal");
      doc.text("FlowStock — Sistema de Controle de Estoque", 14, pageH - 6);
      doc.text(hoje, pageW - 14, pageH - 6, { align: "right" });

      const finalY = ((doc as any).lastAutoTable?.finalY ?? 34) + 8;

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);

      if (totalPaletes > 0) {
        doc.text("Total em paletes", 14, finalY);
        doc.text(`${Number(totalPaletes.toFixed(1)).toLocaleString("pt-BR")} paletes`, 14, finalY + 6);

        doc.text("Valor total em estoque", 70, finalY);
        doc.text(formatarMoeda(valorTotal), 70, finalY + 6);
      } else {
        doc.text("Valor total em estoque", 14, finalY);
        doc.text(formatarMoeda(valorTotal), 14, finalY + 6);
      }

      doc.save(`estoque-${hoje.replace(/\//g, "-")}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    } });
  });
}

function gerarFechamento(rows: EstoqueAtualRow[], movimentacoes: Movimentacao[], capacidadeArmazem: number, tenantNome: string) {
  const hoje = new Date();
  const hojeStr = hoje.toLocaleDateString("pt-BR");

  const movsHoje = movimentacoes.filter((m) => {
    const d = new Date(m.created_at);
    return (
      d.getDate() === hoje.getDate() &&
      d.getMonth() === hoje.getMonth() &&
      d.getFullYear() === hoje.getFullYear()
    );
  });

  function linhasPorNota(tipo: "entrada" | "saida"): string[] {
    const porNota: Record<string, { nota: string | null; itens: string[] }> = {};
    const semNota: string[] = [];

    movsHoje
      .filter((m) => m.tipo === tipo)
      .forEach((m) => {
        const cxPal = m.produtos?.caixas_por_palete ?? null;
        const paletes = cxPal ? Math.round(m.quantidade / cxPal) : m.quantidade;
        const nome = m.produtos?.nome?.toUpperCase() ?? "DESCONHECIDO";
        const item = `${paletes} PALETES DE ${nome}`;

        // A saida agrupa pela OF do carregamento; nota_fiscal, numa saida,
        // guarda a OF de origem do estoque e listaria uma linha por nota.
        // As saidas antigas nao tem of_saida, entao nota_fiscal e o fallback:
        // era ali que a OF de saida era digitada no sistema anterior.
        const chave = tipo === "saida" ? m.of_saida ?? m.nota_fiscal : m.nota_fiscal;

        if (chave) {
          if (!porNota[chave]) porNota[chave] = { nota: chave, itens: [] };
          porNota[chave].itens.push(item);
        } else {
          semNota.push(`• ${item}`);
        }
      });

    const linhasNota = Object.values(porNota).map(
      ({ nota, itens }) => `${nota} - ${itens.join(" / ")}`
    );

    return [...linhasNota, ...semNota];
  }

  const linhasEntradas = linhasPorNota("entrada");
  const linhasSaidas = linhasPorNota("saida");

  if (linhasEntradas.length === 0) linhasEntradas.push("• Nenhuma");
  if (linhasSaidas.length === 0) linhasSaidas.push("• Nenhuma");

  const totalPaletes = rows.reduce((acc, r) => {
    if (!r.caixas_por_palete) return acc;
    return acc + r.estoque_atual / r.caixas_por_palete;
  }, 0);
  const espacoDisponivel = capacidadeArmazem - totalPaletes;

  function emojiProduto(nome: string): string {
    const n = nome.toUpperCase();
    if (n.includes("CREME")) return "🥫";
    if (n.includes("LEITE")) return "🥛";
    if (n.includes("MANTEIGA") || n.includes("BUTTER")) return "🧈";
    if (n.includes("IOGURTE") || n.includes("YOGURT")) return "🫙";
    if (n.includes("QUEIJO") || n.includes("CHEESE")) return "🧀";
    return "📦";
  }

  const linhasEstoque = rows
    .filter((r) => r.caixas_por_palete && r.estoque_atual > 0)
    .map((r) => {
      const pal = Number((r.estoque_atual / r.caixas_por_palete!).toFixed(1)).toLocaleString("pt-BR");
      const cx = r.estoque_atual.toLocaleString("pt-BR");
      return `${emojiProduto(r.nome)} ${r.nome.toUpperCase()}: ${pal} paletes (${cx} cx)\n`;
    });

  return [
    `*FECHAMENTO ${tenantNome.toUpperCase()} - ${hojeStr}*`,
    ``,
    `📦 Movimentação do dia`,
    ``,
    `Entradas:`,
    ...linhasEntradas,
    ``,
    `Saídas:`,
    ...linhasSaidas,
    ``,
    `🏭 Estoque no Armazém`,
    ``,
    ...linhasEstoque,
    ``,
    `🚩 Totais e Capacidade`,
    `Total Geral: ${Number(totalPaletes.toFixed(1)).toLocaleString("pt-BR")} paletes`,
    `Espaço disponível: ${Number(espacoDisponivel.toFixed(1)).toLocaleString("pt-BR")} paletes`,
  ].join("\n");
}

function gerarMensagem(rows: EstoqueAtualRow[], valorTotal: number, totalPaletes: number) {
  const hoje = new Date().toLocaleDateString("pt-BR");
  const linhas = rows.map((r) => {
    const paletes = r.caixas_por_palete && r.estoque_atual > 0
      ? ` (${Number((r.estoque_atual / r.caixas_por_palete).toFixed(1)).toLocaleString("pt-BR")} pal.)`
      : "";
    const status = r.estoque_atual <= r.estoque_minimo ? " ⚠️" : "";
    return `• ${r.nome}: ${r.estoque_atual.toLocaleString("pt-BR")} ${r.unidade}${paletes}${status}`;
  });

  return [
    `*RELATÓRIO DE ESTOQUE*`,
    `_${hoje}_`,
    ``,
    ...linhas,
    ``,
    totalPaletes > 0 ? `*Total: ${Number(totalPaletes.toFixed(1)).toLocaleString("pt-BR")} paletes*` : null,
    `*Valor total: ${formatarMoeda(valorTotal)}*`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

function baixarCSV(rows: EstoqueAtualRow[]) {
  const cabecalho = ["Produto", "Categoria", "Unidade", "Estoque Atual", "Paletes", "Est. Mínimo", "Preço Custo (R$)", "Valor em Estoque (R$)", "Status"];
  const linhas = rows.map((r) => [
    r.nome,
    r.categoria ?? "",
    r.unidade,
    r.estoque_atual,
    r.caixas_por_palete && r.estoque_atual > 0 ? Number((r.estoque_atual / r.caixas_por_palete).toFixed(1)) : "",
    r.estoque_minimo,
    r.preco_custo.toFixed(2).replace(".", ","),
    (r.estoque_atual * r.preco_custo).toFixed(2).replace(".", ","),
    r.estoque_atual <= r.estoque_minimo ? "Baixo" : "Ok",
  ]);

  const csv = [cabecalho, ...linhas]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const hoje = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
  a.href = url;
  a.download = `estoque-${hoje}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TabelaEstoqueAtual({ rows, movimentacoes, podeFechamento, capacidadeArmazem, tenantNome }: Props) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const valorTotal = rows.reduce((acc, r) => acc + r.estoque_atual * r.preco_custo, 0);
  const totalPaletes = rows.reduce((acc, r) => {
    if (!r.caixas_por_palete) return acc;
    return acc + r.estoque_atual / r.caixas_por_palete;
  }, 0);

  if (rows.length === 0) {
    return (
      <div className="glass-panel py-16 text-center">
        <p className="text-sm text-brand-light">Nenhum produto cadastrado.</p>
      </div>
    );
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }

  async function handleCopiar() {
    try {
      await navigator.clipboard.writeText(gerarMensagem(rows, valorTotal, totalPaletes));
      showToast("Relatório copiado!");
    } catch {}
  }

  async function handleCopiarFechamento() {
    try {
      await navigator.clipboard.writeText(gerarFechamento(rows, movimentacoes, capacidadeArmazem, tenantNome));
      showToast("Fechamento copiado!");
    } catch {}
  }

  return (
    <div className="flex flex-col gap-3">
      {typeof document !== "undefined" && createPortal(
        <div style={{ position: "fixed", top: 24, left: "50%", pointerEvents: "none", zIndex: 9999 }}>
          <div style={{
            transform: toastMsg ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(-10px)",
            opacity: toastMsg ? 1 : 0,
            transition: "opacity 0.25s ease, transform 0.25s ease",
            background: "rgba(15,15,26,0.92)",
            border: "1px solid rgba(108,99,255,0.35)",
            color: "#c4beff",
            borderRadius: "10px",
            padding: "9px 20px",
            fontSize: "13px",
            fontWeight: 600,
            backdropFilter: "blur(10px)",
            whiteSpace: "nowrap",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}>
            {toastMsg}
          </div>
        </div>,
        document.body
      )}
      <div className="flex justify-end gap-2 flex-wrap">
        {podeFechamento && (
          <button onClick={handleCopiarFechamento} className="btn-secondary flex items-center gap-2">
            <Icon icon="tabler:clipboard-copy" width={14} />
            Fechamento do dia
          </button>
        )}
        <button onClick={handleCopiar} className="btn-secondary flex items-center gap-2">
          <Icon icon="tabler:copy" width={14} />
          Copiar mensagem
        </button>
        <button
          onClick={() => baixarCSV(rows)}
          className="btn-secondary flex items-center gap-2"
        >
          <Icon icon="tabler:file-type-csv" width={14} />
          Exportar CSV
        </button>
        <button
          onClick={() => gerarPDF(rows, valorTotal, totalPaletes)}
          className="btn-secondary flex items-center gap-2"
        >
          <Icon icon="tabler:file-type-pdf" width={14} />
          Exportar PDF
        </button>
      </div>

      <div className="glass-table overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[700px]">
          <thead>
            <tr className="table-header">
              <th className="table-th">Produto</th>
              <th className="table-th">Categoria</th>
              <th className="table-th">Unidade</th>
              <th className="table-th-right">Estoque Atual</th>
              <th className="table-th-right">Est. Mínimo</th>
              <th className="table-th-right">Preço Custo</th>
              <th className="table-th-right">Valor em Estoque</th>
              <th className="table-th">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const baixo = row.estoque_atual <= row.estoque_minimo;
              return (
                <tr
                  key={row.id}
                  className={`border-b border-brand-border/40 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}
                >
                  <td className="py-3 px-4 font-medium text-white">{row.nome}</td>
                  <td className="py-3 px-4 text-brand-medium">{row.categoria ?? "—"}</td>
                  <td className="py-3 px-4 text-brand-medium">{row.unidade}</td>
                  <td className={`py-3 px-4 text-right font-semibold td-num ${baixo ? "text-red-400" : "text-white"}`}>
                    {row.estoque_atual.toLocaleString("pt-BR")}
                    {row.caixas_por_palete && row.estoque_atual > 0 && (
                      <span className="block text-xs font-normal text-brand-medium">
                        {Number((row.estoque_atual / row.caixas_por_palete).toFixed(1)).toLocaleString("pt-BR")} pal.
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-brand-light td-num">{row.estoque_minimo.toLocaleString("pt-BR")}</td>
                  <td className="py-3 px-4 text-right text-brand-light td-num"><ValorPrivado>{formatarMoeda(row.preco_custo)}</ValorPrivado></td>
                  <td className="py-3 px-4 text-right font-medium text-white td-num">
                    <ValorPrivado>{formatarMoeda(row.estoque_atual * row.preco_custo)}</ValorPrivado>
                  </td>
                  <td className="py-3 px-4">
                    <span className={baixo ? "badge-status-baixo" : "badge-status-ok"}>
                      {baixo ? "Baixo" : "Ok"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {totalPaletes > 0 && (
              <tr className="border-t border-brand-border bg-brand-hover/20">
                <td colSpan={6} className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-white text-right">
                  Total em paletes
                </td>
                <td className="py-3 px-4 text-right font-bold text-white td-num">
                  {Number(totalPaletes.toFixed(1)).toLocaleString("pt-BR")} pal.
                </td>
                <td />
              </tr>
            )}
            <tr className="border-t border-brand-border bg-brand-hover/20">
              <td colSpan={6} className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-white text-right">
                Valor total em estoque
              </td>
              <td className="py-3 px-4 text-right font-bold text-white">
                <ValorPrivado>{formatarMoeda(valorTotal)}</ValorPrivado>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

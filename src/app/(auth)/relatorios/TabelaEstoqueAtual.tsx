"use client";

import { useState } from "react";
import { EstoqueAtualRow, Movimentacao } from "@/types";
import { formatarMoeda } from "@/lib/utils";

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
      doc.text("Relatorio de Estoque", 14, 21);

      // Data alinhada a direita
      doc.setFontSize(9);
      doc.setTextColor(113, 113, 122);
      doc.text(`Gerado em ${hoje}`, pageW - 14, 17, { align: "right" });

      autoTable(doc, {
        startY: 34,
        margin: { left: 14, right: 14 },
        head: [["Produto", "Categoria", "Un.", "Estoque Atual", "Paletes", "Min.", "Preco Custo", "Valor em Estoque", "Status"]],
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
    } catch {} });
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

        if (m.nota_fiscal) {
          if (!porNota[m.nota_fiscal]) porNota[m.nota_fiscal] = { nota: m.nota_fiscal, itens: [] };
          porNota[m.nota_fiscal].itens.push(item);
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
    `*RELATORIO DE ESTOQUE*`,
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

export default function TabelaEstoqueAtual({ rows, movimentacoes, podeFechamento, capacidadeArmazem, tenantNome }: Props) {
  const [copiado, setCopiado] = useState(false);
  const [copiadoFechamento, setCopiadoFechamento] = useState(false);

  const valorTotal = rows.reduce((acc, r) => acc + r.estoque_atual * r.preco_custo, 0);
  const totalPaletes = rows.reduce((acc, r) => {
    if (!r.caixas_por_palete) return acc;
    return acc + r.estoque_atual / r.caixas_por_palete;
  }, 0);

  if (rows.length === 0) {
    return (
      <div className="glass-panel py-16 text-center">
        <p className="text-sm text-zinc-400">Nenhum produto cadastrado.</p>
      </div>
    );
  }

  async function handleCopiar() {
    try {
      const mensagem = gerarMensagem(rows, valorTotal, totalPaletes);
      await navigator.clipboard.writeText(mensagem);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {}
  }

  async function handleCopiarFechamento() {
    try {
      const mensagem = gerarFechamento(rows, movimentacoes, capacidadeArmazem, tenantNome);
      await navigator.clipboard.writeText(mensagem);
      setCopiadoFechamento(true);
      setTimeout(() => setCopiadoFechamento(false), 2500);
    } catch {}
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end gap-2 flex-wrap">
        {podeFechamento && (
          <button
            onClick={handleCopiarFechamento}
            className="btn-secondary flex items-center gap-2"
          >
            {copiadoFechamento ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copiado!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Fechamento do dia
              </>
            )}
          </button>
        )}
        <button
          onClick={handleCopiar}
          className="btn-secondary flex items-center gap-2"
        >
          {copiado ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copiado!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              Copiar mensagem
            </>
          )}
        </button>
        <button
          onClick={() => gerarPDF(rows, valorTotal, totalPaletes)}
          className="btn-secondary flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="10" y1="9" x2="8" y2="9"/>
          </svg>
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
              <th className="table-th-right">Est. Minimo</th>
              <th className="table-th-right">Preco Custo</th>
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
                  className={`border-b border-white/[0.04] ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}
                >
                  <td className="py-3 px-4 font-medium text-white">{row.nome}</td>
                  <td className="py-3 px-4 text-zinc-500">{row.categoria ?? "—"}</td>
                  <td className="py-3 px-4 text-zinc-500">{row.unidade}</td>
                  <td className={`py-3 px-4 text-right font-semibold td-num ${baixo ? "text-red-400" : "text-white"}`}>
                    {row.estoque_atual.toLocaleString("pt-BR")}
                    {row.caixas_por_palete && row.estoque_atual > 0 && (
                      <span className="block text-xs font-normal text-zinc-500">
                        {Number((row.estoque_atual / row.caixas_por_palete).toFixed(1)).toLocaleString("pt-BR")} pal.
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-400 td-num">{row.estoque_minimo.toLocaleString("pt-BR")}</td>
                  <td className="py-3 px-4 text-right text-zinc-400 td-num">{formatarMoeda(row.preco_custo)}</td>
                  <td className="py-3 px-4 text-right font-medium text-white td-num">
                    {formatarMoeda(row.estoque_atual * row.preco_custo)}
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
              <tr className="border-t border-white/[0.06] bg-white/[0.02]">
                <td colSpan={6} className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-white text-right">
                  Total em paletes
                </td>
                <td className="py-3 px-4 text-right font-bold text-white td-num">
                  {Number(totalPaletes.toFixed(1)).toLocaleString("pt-BR")} pal.
                </td>
                <td />
              </tr>
            )}
            <tr className="border-t border-white/[0.06] bg-white/[0.02]">
              <td colSpan={6} className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-white text-right">
                Valor total em estoque
              </td>
              <td className="py-3 px-4 text-right font-bold text-white">
                {formatarMoeda(valorTotal)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

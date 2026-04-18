"use client";

import { EstoqueAtualRow } from "@/types";
import { formatarMoeda } from "@/lib/utils";

type Props = {
  rows: EstoqueAtualRow[];
};

export default function TabelaEstoqueAtual({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="glass-panel py-16 text-center">
        <p className="text-sm text-zinc-400">Nenhum produto cadastrado.</p>
      </div>
    );
  }

  const valorTotal = rows.reduce((acc, r) => acc + r.estoque_atual * r.preco_custo, 0);

  return (
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
                  {row.estoque_atual}
                </td>
                <td className="py-3 px-4 text-right text-zinc-400 td-num">{row.estoque_minimo}</td>
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
          <tr className="border-t border-white/[0.06] bg-white/[0.02]">
            <td colSpan={6} className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-white text-right">
              Valor total em estoque
            </td>
            <td className="py-3 px-4 text-right font-bold text-white">
              {formatarMoeda(valorTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

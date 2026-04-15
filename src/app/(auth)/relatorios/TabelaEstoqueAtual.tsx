"use client";

import { EstoqueAtualRow } from "@/types";

type Props = {
  rows: EstoqueAtualRow[];
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function TabelaEstoqueAtual({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="border border-zinc-200 bg-white py-16 text-center">
        <p className="text-sm text-zinc-400">Nenhum produto cadastrado.</p>
      </div>
    );
  }

  const valorTotal = rows.reduce((acc, r) => acc + r.estoque_atual * r.preco_custo, 0);

  return (
    <div className="border border-zinc-200 bg-white shadow-sm overflow-x-auto">
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
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const baixo = row.estoque_atual <= row.estoque_minimo;
            return (
              <tr
                key={row.id}
                className={`border-b border-zinc-100 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}
              >
                <td className="py-3 px-4 font-medium text-black">{row.nome}</td>
                <td className="py-3 px-4 text-zinc-500">{row.categoria ?? "—"}</td>
                <td className="py-3 px-4 text-zinc-500">{row.unidade}</td>
                <td className={`py-3 px-4 text-right font-semibold ${baixo ? "text-red-600" : "text-black"}`}>
                  {row.estoque_atual}
                </td>
                <td className="py-3 px-4 text-right text-zinc-500">{row.estoque_minimo}</td>
                <td className="py-3 px-4 text-right text-zinc-500">{formatarMoeda(row.preco_custo)}</td>
                <td className="py-3 px-4 text-right font-medium text-black">
                  {formatarMoeda(row.estoque_atual * row.preco_custo)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-zinc-100 border-t border-zinc-300">
            <td colSpan={6} className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-black text-right">
              Valor total em estoque
            </td>
            <td className="py-3 px-4 text-right font-bold text-black">
              {formatarMoeda(valorTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

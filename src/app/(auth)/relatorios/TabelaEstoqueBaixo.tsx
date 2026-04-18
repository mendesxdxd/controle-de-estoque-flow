"use client";

import { EstoqueAtualRow } from "@/types";

type Props = {
  rows: EstoqueAtualRow[];
};

export default function TabelaEstoqueBaixo({ rows }: Props) {
  return (
    <div className="glass-table overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[400px]">
        <thead>
          <tr className="table-header">
            <th className="table-th">Produto</th>
            <th className="table-th">Categoria</th>
            <th className="table-th-right">Estoque Atual</th>
            <th className="table-th-right">Est. Minimo</th>
            <th className="table-th-right">Diferenca</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              className={`border-b border-white/[0.04] ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}
            >
              <td className="py-3 px-4 font-medium text-white">{row.nome}</td>
              <td className="py-3 px-4 text-zinc-500">{row.categoria ?? "—"}</td>
              <td className="py-3 px-4 text-right font-semibold text-red-400">{row.estoque_atual}</td>
              <td className="py-3 px-4 text-right text-zinc-500">{row.estoque_minimo}</td>
              <td className="py-3 px-4 text-right font-semibold text-red-400">
                {row.estoque_atual - row.estoque_minimo}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

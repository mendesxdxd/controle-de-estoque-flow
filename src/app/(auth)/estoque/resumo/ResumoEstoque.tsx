"use client";

import { useMemo, useState } from "react";
import { Movimentacao } from "@/types";
import DatePicker from "@/components/shared/DatePicker";

type Props = { movimentacoes: Movimentacao[] };

function hojeStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function toLocalDateStr(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ResumoEstoque({ movimentacoes }: Props) {
  const [data, setData] = useState(hojeStr());

  const { resumo, totalMovs, totalEntradas, totalSaidas } = useMemo(() => {
    const filtradas = movimentacoes.filter((mov) => toLocalDateStr(mov.created_at) === data);
    const mapa: Record<string, { nome: string; unidade: string; entradas: number; saidas: number }> = {};
    for (const mov of filtradas) {
      if (!mapa[mov.produto_id]) {
        mapa[mov.produto_id] = { nome: mov.produtos?.nome ?? "—", unidade: mov.produtos?.unidade ?? "", entradas: 0, saidas: 0 };
      }
      if (mov.tipo === "entrada") mapa[mov.produto_id].entradas += mov.quantidade;
      else mapa[mov.produto_id].saidas += mov.quantidade;
    }
    const resumo = Object.values(mapa);
    const totalEntradas = filtradas.filter((m) => m.tipo === "entrada").reduce((acc, m) => acc + m.quantidade, 0);
    const totalSaidas = filtradas.filter((m) => m.tipo === "saida").reduce((acc, m) => acc + m.quantidade, 0);
    return { resumo, totalMovs: filtradas.length, totalEntradas, totalSaidas };
  }, [movimentacoes, data]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-brand-light block mb-2">Data</label>
        <DatePicker value={data} onChange={setData} />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel p-4">
          <p className="text-xs text-brand-medium mb-1">Movimentações</p>
          <p className="text-2xl font-bold text-white">{totalMovs}</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-brand-medium mb-1">Total entradas</p>
          <p className="text-2xl font-bold text-brand-primary">{totalEntradas} cx</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-brand-medium mb-1">Total saídas</p>
          <p className="text-2xl font-bold text-brand-light">{totalSaidas} cx</p>
        </div>
      </div>

      {resumo.length === 0 ? (
        <div className="glass-panel py-16 text-center">
          <p className="text-sm text-brand-light">Nenhuma movimentação nesta data.</p>
        </div>
      ) : (
        <div className="glass-table overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[400px]">
            <thead>
              <tr className="table-header">
                <th className="table-th">Produto</th>
                <th className="table-th-right">Entradas</th>
                <th className="table-th-right">Saídas</th>
                <th className="table-th-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {resumo.map((r, i) => {
                const saldo = r.entradas - r.saidas;
                return (
                  <tr key={i} className={`border-b border-brand-border/40 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}>
                    <td className="py-3 px-4 font-medium text-white">{r.nome}</td>
                    <td className="py-3 px-4 text-right text-brand-primary font-medium">{r.entradas} {r.unidade}</td>
                    <td className="py-3 px-4 text-right text-brand-light font-medium">{r.saidas} {r.unidade}</td>
                    <td className={`py-3 px-4 text-right font-bold ${saldo >= 0 ? "text-white" : "text-red-400"}`}>
                      {saldo >= 0 ? "+" : ""}{saldo} {r.unidade}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/[0.1]">
                <td className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-brand-medium">Total</td>
                <td className="py-3 px-4 text-right font-bold text-brand-primary">{totalEntradas} cx</td>
                <td className="py-3 px-4 text-right font-bold text-brand-light">{totalSaidas} cx</td>
                <td className={`py-3 px-4 text-right font-bold ${totalEntradas - totalSaidas >= 0 ? "text-white" : "text-red-400"}`}>
                  {totalEntradas - totalSaidas >= 0 ? "+" : ""}{totalEntradas - totalSaidas} cx
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

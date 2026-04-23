"use client";

import { useMemo, useState } from "react";
import { Movimentacao } from "@/types";

type Props = { movimentacoes: Movimentacao[] };

export default function PorNota({ movimentacoes }: Props) {
  const [busca, setBusca] = useState("");

  const { resultado, resumo } = useMemo(() => {
    const termo = busca.trim();
    if (!termo) return { resultado: [], resumo: null };

    const movs = movimentacoes.filter((mov) =>
      mov.nota_fiscal?.toLowerCase().includes(termo.toLowerCase())
    );

    if (movs.length === 0) return { resultado: [], resumo: null };

    const totalCaixas = movs.reduce((acc, m) => acc + m.quantidade, 0);
    const datas = movs.map((m) => new Date(m.created_at));
    const dataMin = new Date(Math.min(...datas.map((d) => d.getTime())));
    const dataMax = new Date(Math.max(...datas.map((d) => d.getTime())));
    const tipos = [...new Set(movs.map((m) => m.tipo))];

    const porProduto: Record<string, { nome: string; unidade: string; entradas: number; saidas: number }> = {};
    for (const mov of movs) {
      if (!porProduto[mov.produto_id]) {
        porProduto[mov.produto_id] = { nome: mov.produtos?.nome ?? "—", unidade: mov.produtos?.unidade ?? "", entradas: 0, saidas: 0 };
      }
      if (mov.tipo === "entrada") porProduto[mov.produto_id].entradas += mov.quantidade;
      else porProduto[mov.produto_id].saidas += mov.quantidade;
    }

    return {
      resultado: Object.values(porProduto),
      resumo: {
        totalCaixas,
        totalProdutos: Object.keys(porProduto).length,
        totalMovs: movs.length,
        dataMin,
        dataMax,
        tipo: tipos.length === 1 ? tipos[0] : "misto",
      },
    };
  }, [movimentacoes, busca]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">Numero da nota</label>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Ex: 6100181424"
          className="input-field max-w-xs"
        />
      </div>

      {busca.trim() && resultado.length === 0 && (
        <div className="glass-panel py-16 text-center">
          <p className="text-sm text-zinc-400">Nenhuma movimentacao encontrada para essa nota.</p>
        </div>
      )}

      {resumo && (
        <>
          {/* Cards resumo */}
          <div className="grid grid-cols-4 gap-4">
            <div className="glass-panel p-4">
              <p className="text-xs text-zinc-500 mb-1">Movimentacoes</p>
              <p className="text-2xl font-bold text-white">{resumo.totalMovs}</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-xs text-zinc-500 mb-1">Produtos</p>
              <p className="text-2xl font-bold text-white">{resumo.totalProdutos}</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-xs text-zinc-500 mb-1">Total caixas</p>
              <p className="text-2xl font-bold text-indigo-400">{resumo.totalCaixas} cx</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-xs text-zinc-500 mb-1">Tipo</p>
              <p className="text-2xl font-bold capitalize text-white">{resumo.tipo}</p>
            </div>
          </div>

          {/* Data */}
          <p className="text-xs text-zinc-500 px-1">
            {resumo.dataMin.toLocaleDateString("pt-BR") === resumo.dataMax.toLocaleDateString("pt-BR")
              ? `Data: ${resumo.dataMin.toLocaleDateString("pt-BR")}`
              : `Periodo: ${resumo.dataMin.toLocaleDateString("pt-BR")} — ${resumo.dataMax.toLocaleDateString("pt-BR")}`
            }
          </p>

          {/* Tabela agrupada por produto */}
          <div className="glass-table overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[400px]">
              <thead>
                <tr className="table-header">
                  <th className="table-th">Produto</th>
                  <th className="table-th-right">Entradas</th>
                  <th className="table-th-right">Saidas</th>
                  <th className="table-th-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {resultado.map((r, i) => {
                  const saldo = r.entradas - r.saidas;
                  return (
                    <tr key={i} className={`border-b border-white/[0.04] ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}>
                      <td className="py-3 px-4 font-medium text-white">{r.nome}</td>
                      <td className="py-3 px-4 text-right text-indigo-400 font-medium">
                        {r.entradas > 0 ? `${r.entradas} ${r.unidade}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-400 font-medium">
                        {r.saidas > 0 ? `${r.saidas} ${r.unidade}` : "—"}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${saldo >= 0 ? "text-white" : "text-red-400"}`}>
                        {saldo >= 0 ? "+" : ""}{saldo} {r.unidade}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

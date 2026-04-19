"use client";

import { useState, useMemo } from "react";
import { Movimentacao } from "@/types";

type Props = {
  movimentacoes: Movimentacao[];
};

export default function FiltroMovimentacoes({ movimentacoes }: Props) {
  const [tipo, setTipo] = useState<"todos" | "entrada" | "saida">("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const { filtradas, totalEntradas, totalSaidas } = useMemo(() => {
    const filtradas = movimentacoes.filter((mov) => {
      if (tipo !== "todos" && mov.tipo !== tipo) return false;
      const data = new Date(mov.created_at);
      if (dataInicio && data < new Date(dataInicio)) return false;
      if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59);
        if (data > fim) return false;
      }
      return true;
    });
    const totalEntradas = filtradas.filter((m) => m.tipo === "entrada").reduce((acc, m) => acc + m.quantidade, 0);
    const totalSaidas = filtradas.filter((m) => m.tipo === "saida").reduce((acc, m) => acc + m.quantidade, 0);
    return { filtradas, totalEntradas, totalSaidas };
  }, [movimentacoes, tipo, dataInicio, dataFim]);

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-panel p-5 flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Tipo</label>
          <div className="flex bg-white/5 border border-white/[0.08] rounded-xl p-1 gap-1">
            {(["todos", "entrada", "saida"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`px-4 py-2 text-sm font-semibold capitalize rounded-lg transition-all duration-150 ${
                  tipo === t ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white hover:bg-white/5"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Data inicio</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Data fim</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="input-field"
          />
        </div>

        {(dataInicio || dataFim || tipo !== "todos") && (
          <button
            onClick={() => { setTipo("todos"); setDataInicio(""); setDataFim(""); }}
            className="text-xs font-semibold text-zinc-500 hover:text-white underline pb-2 transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="flex gap-6 py-3 px-1">
        <span className="text-xs text-zinc-500">
          <span className="font-bold text-white">{filtradas.length}</span> registros
        </span>
        <span className="text-xs text-zinc-500">
          Entradas: <span className="font-bold text-white">{totalEntradas}</span>
        </span>
        <span className="text-xs text-zinc-500">
          Saidas: <span className="font-bold text-white">{totalSaidas}</span>
        </span>
      </div>

      {filtradas.length === 0 ? (
        <div className="glass-panel py-16 text-center">
          <p className="text-sm text-zinc-400">Nenhuma movimentacao encontrada.</p>
        </div>
      ) : (
        <div className="glass-table overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="table-header">
                <th className="table-th">Data</th>
                <th className="table-th">Produto</th>
                <th className="table-th">Tipo</th>
                <th className="table-th-right">Quantidade</th>
                <th className="table-th">Observacao</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((mov, i) => (
                <tr
                  key={mov.id}
                  className={`border-b border-white/[0.04] ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}
                >
                  <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                    {new Date(mov.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-3 px-4 font-medium text-white">{mov.produtos?.nome ?? "—"}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      mov.tipo === "entrada" ? "bg-indigo-500/15 text-indigo-400" : "bg-zinc-700/50 text-zinc-400"
                    }`}>
                      {mov.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-white">
                    {mov.quantidade} {mov.produtos?.unidade ?? ""}
                  </td>
                  <td className="py-3 px-4 text-zinc-500">{mov.observacao ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

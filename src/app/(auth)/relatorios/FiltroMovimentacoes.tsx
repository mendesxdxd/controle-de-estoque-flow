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

  const filtradas = useMemo(() => {
    return movimentacoes.filter((mov) => {
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
  }, [movimentacoes, tipo, dataInicio, dataFim]);

  const totalEntradas = filtradas.filter((m) => m.tipo === "entrada").reduce((acc, m) => acc + m.quantidade, 0);
  const totalSaidas = filtradas.filter((m) => m.tipo === "saida").reduce((acc, m) => acc + m.quantidade, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-zinc-200 shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-black">Tipo</label>
          <div className="flex border border-black">
            {(["todos", "entrada", "saida"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`px-4 py-2 text-sm font-semibold capitalize transition-all duration-150 ${
                  tipo === t ? "bg-black text-white" : "bg-white text-black hover:bg-zinc-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-black">Data inicio</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-black">Data fim</label>
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
            className="text-xs font-semibold text-zinc-500 hover:text-black underline pb-2 transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="flex gap-6 py-3 px-1">
        <span className="text-xs text-zinc-500">
          <span className="font-bold text-black">{filtradas.length}</span> registros
        </span>
        <span className="text-xs text-zinc-500">
          Entradas: <span className="font-bold text-black">{totalEntradas}</span>
        </span>
        <span className="text-xs text-zinc-500">
          Saidas: <span className="font-bold text-black">{totalSaidas}</span>
        </span>
      </div>

      {filtradas.length === 0 ? (
        <div className="border border-zinc-200 bg-white py-16 text-center">
          <p className="text-sm text-zinc-400">Nenhuma movimentacao encontrada.</p>
        </div>
      ) : (
        <div className="border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm border-collapse">
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
                  className={`border-b border-zinc-100 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}
                >
                  <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">
                    {new Date(mov.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-3 px-4 font-medium text-black">{mov.produtos?.nome ?? "—"}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 ${
                      mov.tipo === "entrada" ? "bg-black text-white" : "bg-zinc-200 text-zinc-700"
                    }`}>
                      {mov.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-black">
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

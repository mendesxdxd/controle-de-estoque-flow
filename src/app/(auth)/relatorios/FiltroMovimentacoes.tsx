"use client";

import { useState, useMemo } from "react";
import { Movimentacao } from "@/types";
import DatePicker from "@/components/shared/DatePicker";

type Props = {
  movimentacoes: Movimentacao[];
};

function hojeStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

export default function FiltroMovimentacoes({ movimentacoes }: Props) {
  const [tipo, setTipo] = useState<"todos" | "entrada" | "saida">("todos");
  const [data, setData] = useState(hojeStr());

  const { filtradas, totalEntradas, totalSaidas } = useMemo(() => {
    const filtradas = movimentacoes.filter((mov) => {
      if (tipo !== "todos" && mov.tipo !== tipo) return false;
      return new Date(mov.created_at).toISOString().slice(0, 10) === data;
    });
    const totalEntradas = filtradas.filter((m) => m.tipo === "entrada").reduce((acc, m) => acc + m.quantidade, 0);
    const totalSaidas = filtradas.filter((m) => m.tipo === "saida").reduce((acc, m) => acc + m.quantidade, 0);
    return { filtradas, totalEntradas, totalSaidas };
  }, [movimentacoes, tipo, data]);

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
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Data</label>
          <DatePicker value={data} onChange={setData} />
        </div>
      </div>

      <div className="flex gap-6 py-3 px-1">
        <span className="text-xs text-zinc-500">
          <span className="font-bold text-white">{filtradas.length}</span> registros
        </span>
        <span className="text-xs text-zinc-500">
          Entradas: <span className="font-bold text-indigo-400">{totalEntradas}</span>
        </span>
        <span className="text-xs text-zinc-500">
          Saidas: <span className="font-bold text-zinc-300">{totalSaidas}</span>
        </span>
      </div>

      {filtradas.length === 0 ? (
        <div className="glass-panel py-16 text-center">
          <p className="text-sm text-zinc-400">Nenhuma movimentacao nesta data.</p>
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
                    <div>{new Date(mov.created_at).toLocaleDateString("pt-BR")}</div>
                    <div className="text-xs text-zinc-600">{new Date(mov.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
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

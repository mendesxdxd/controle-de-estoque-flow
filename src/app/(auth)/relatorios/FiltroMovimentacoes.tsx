"use client";

import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { Movimentacao } from "@/types";
import DatePicker from "@/components/shared/DatePicker";

function baixarCSVMovimentacoes(movs: Movimentacao[], data: string) {
  const cabecalho = ["Data", "Hora", "Produto", "Unidade", "Tipo", "Quantidade", "OF", "OF saída", "Observação"];
  const linhas = movs.map((m) => {
    const d = new Date(m.created_at);
    return [
      d.toLocaleDateString("pt-BR"),
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      m.produtos?.nome ?? "",
      m.produtos?.unidade ?? "",
      m.tipo,
      m.quantidade,
      m.nota_fiscal ?? "",
      m.of_saida ?? "",
      m.observacao ?? "",
    ];
  });

  const csv = [cabecalho, ...linhas]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `movimentacoes-${data}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

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
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Tipo</label>
          <div className="flex bg-brand-hover border border-brand-border rounded-xl p-1 gap-1">
            {(["todos", "entrada", "saida"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`px-4 py-2 text-sm font-semibold capitalize rounded-lg transition-all duration-150 ${
                  tipo === t ? "bg-brand-hover text-white" : "text-brand-medium hover:text-white hover:bg-brand-hover"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Data</label>
          <DatePicker value={data} onChange={setData} />
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 py-3 px-1">
        <div className="flex gap-6">
          <span className="text-xs text-brand-medium">
            <span className="font-bold text-white">{filtradas.length}</span> registros
          </span>
          <span className="text-xs text-brand-medium">
            Entradas: <span className="font-bold text-brand-primary">{totalEntradas}</span>
          </span>
          <span className="text-xs text-brand-medium">
            Saídas: <span className="font-bold text-brand-light">{totalSaidas}</span>
          </span>
        </div>
        {filtradas.length > 0 && (
          <button
            onClick={() => baixarCSVMovimentacoes(filtradas, data)}
            className="btn-secondary flex items-center gap-2"
          >
            <Icon icon="tabler:download" width={14} />
            Exportar CSV
          </button>
        )}
      </div>

      {filtradas.length === 0 ? (
        <div className="glass-panel py-16 text-center">
          <p className="text-sm text-brand-light">Nenhuma movimentação nesta data.</p>
        </div>
      ) : (
        <div className="glass-table overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="table-header">
                <th className="table-th">Data</th>
                <th className="table-th">OF saída</th>
                <th className="table-th">Produto</th>
                <th className="table-th">Tipo</th>
                <th className="table-th-right">Quantidade</th>
                <th className="table-th">Observação</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((mov, i) => (
                <tr
                  key={mov.id}
                  className={`border-b border-brand-border/40 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}
                >
                  <td className="py-3 px-4 text-brand-light whitespace-nowrap">
                    <div>{new Date(mov.created_at).toLocaleDateString("pt-BR")}</div>
                    <div className="text-xs text-brand-muted">{new Date(mov.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                  </td>
                  <td className="py-3 px-4 text-brand-light font-mono text-xs">{mov.of_saida ?? "—"}</td>
                  <td className="py-3 px-4 font-medium text-white">{mov.produtos?.nome ?? "—"}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      mov.tipo === "entrada" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                    }`}>
                      {mov.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-white">
                    {mov.quantidade} {mov.produtos?.unidade ?? ""}
                  </td>
                  <td className="py-3 px-4 text-brand-medium">{mov.observacao ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

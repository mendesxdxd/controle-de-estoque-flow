"use client";

import { useMemo, useState } from "react";
import { Movimentacao, Produto } from "@/types";
import GraficoEstoque from "@/components/shared/GraficoEstoque";

type Props = {
  movimentacoes: Movimentacao[];
  produtos: Produto[];
};

function toLocalDateStr(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function PorProduto({ movimentacoes, produtos }: Props) {
  const [produtoId, setProdutoId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const movsProduto = useMemo(() =>
    movimentacoes.filter((m) => m.produto_id === produtoId),
    [movimentacoes, produtoId]
  );

  const movsFiltradas = useMemo(() => {
    return movsProduto.filter((m) => {
      const d = toLocalDateStr(m.created_at);
      if (dataInicio && d < dataInicio) return false;
      if (dataFim && d > dataFim) return false;
      return true;
    });
  }, [movsProduto, dataInicio, dataFim]);

  const stats = useMemo(() => {
    const unidade = movsProduto[0]?.produtos?.unidade ?? "cx";
    const saldoAtual = movsProduto.reduce((acc, m) =>
      acc + (m.tipo === "entrada" ? m.quantidade : -m.quantidade), 0
    );
    const totalEntradas = movsProduto.filter((m) => m.tipo === "entrada").reduce((acc, m) => acc + m.quantidade, 0);
    const totalSaidas = movsProduto.filter((m) => m.tipo === "saida").reduce((acc, m) => acc + m.quantidade, 0);
    return { saldoAtual, totalEntradas, totalSaidas, unidade };
  }, [movsProduto]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-brand-light block mb-2">Produto</label>
        <select
          value={produtoId}
          onChange={(e) => setProdutoId(e.target.value)}
          className="input-field max-w-xs"
        >
          <option value="">Selecione um produto</option>
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </div>

      {produtoId && movsProduto.length === 0 && (
        <div className="glass-panel py-16 text-center">
          <p className="text-sm text-brand-light">Nenhuma movimentacao encontrada.</p>
        </div>
      )}

      {produtoId && movsProduto.length > 0 && (
        <>
          {/* Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-panel p-4">
              <p className="text-xs text-brand-medium mb-1">Saldo atual</p>
              <p className={`text-2xl font-bold ${stats.saldoAtual >= 0 ? "text-white" : "text-red-400"}`}>
                {stats.saldoAtual} {stats.unidade}
              </p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-xs text-brand-medium mb-1">Total entradas</p>
              <p className="text-2xl font-bold text-brand-primary">{stats.totalEntradas} {stats.unidade}</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-xs text-brand-medium mb-1">Total saidas</p>
              <p className="text-2xl font-bold text-brand-light">{stats.totalSaidas} {stats.unidade}</p>
            </div>
          </div>

          {/* Grafico */}
          <GraficoEstoque movimentacoes={movsProduto} />

          {/* Filtro de periodo da tabela */}
          <div className="flex gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">De</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="input-field text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Ate</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="input-field text-xs"
              />
            </div>
            {(dataInicio || dataFim) && (
              <button
                onClick={() => { setDataInicio(""); setDataFim(""); }}
                className="text-xs text-brand-medium hover:text-white transition-colors pb-2"
              >
                Limpar filtro
              </button>
            )}
          </div>

          {/* Tabela */}
          {movsFiltradas.length === 0 ? (
            <div className="glass-panel py-12 text-center">
              <p className="text-sm text-brand-light">Nenhuma movimentacao no periodo selecionado.</p>
            </div>
          ) : (
            <>
              <div className="flex gap-6 py-1 px-1">
                <span className="text-xs text-brand-medium">
                  <span className="font-bold text-white">{movsFiltradas.length}</span> registros
                </span>
              </div>
              <div className="glass-table overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[400px]">
                  <thead>
                    <tr className="table-header">
                      <th className="table-th">Data</th>
                      <th className="table-th">Tipo</th>
                      <th className="table-th-right">Quantidade</th>
                      <th className="table-th">Observacao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movsFiltradas.map((mov, i) => (
                      <tr key={mov.id} className={`border-b border-brand-border/40 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}>
                        <td className="py-3 px-4 text-brand-light whitespace-nowrap">
                          <div>{new Date(mov.created_at).toLocaleDateString("pt-BR")}</div>
                          <div className="text-xs text-brand-muted">{new Date(mov.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            mov.tipo === "entrada" ? "bg-brand-primary/15 text-brand-primary" : "bg-brand-hover text-brand-light"
                          }`}>
                            {mov.tipo}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-white font-medium">
                          {mov.quantidade} {mov.produtos?.unidade ?? ""}
                        </td>
                        <td className="py-3 px-4 text-brand-medium">{mov.observacao ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

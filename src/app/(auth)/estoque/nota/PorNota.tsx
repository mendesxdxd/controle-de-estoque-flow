"use client";

import { useMemo, useState } from "react";
import { Movimentacao } from "@/types";

type Props = { movimentacoes: Movimentacao[] };

export default function PorNota({ movimentacoes }: Props) {
  const [busca, setBusca] = useState("");

  const { todasOFs, totalOFs, totalPaletesGeral } = useMemo(() => {
    const mapa: Record<string, { of: string; data: Date; tipo: string; totalCaixas: number; totalPaletes: number }> = {};
    for (const mov of movimentacoes) {
      const of = mov.nota_fiscal?.trim();
      if (!of) continue;
      if (!mapa[of]) {
        mapa[of] = { of, data: new Date(mov.created_at), tipo: mov.tipo, totalCaixas: 0, totalPaletes: 0 };
      }
      mapa[of].totalCaixas += mov.quantidade;
      const cxPalete = mov.produtos?.caixas_por_palete;
      if (cxPalete && cxPalete > 0) mapa[of].totalPaletes += mov.quantidade / cxPalete;
      if (new Date(mov.created_at) > mapa[of].data) mapa[of].data = new Date(mov.created_at);
      if (mapa[of].tipo !== mov.tipo) mapa[of].tipo = "misto";
    }
    const todas = Object.values(mapa).sort((a, b) => b.data.getTime() - a.data.getTime());
    return {
      todasOFs: todas.slice(0, 8),
      totalOFs: todas.length,
      totalPaletesGeral: todas.reduce((acc, row) => acc + row.totalPaletes, 0),
    };
  }, [movimentacoes]);

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
      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-brand-light block">Buscar OF</label>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Ex: 6100181424"
          className="input-field max-w-xs"
        />
      </div>

      {/* Tabela geral de OFs */}
      {!busca.trim() && todasOFs.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="glass-panel px-4 py-2 flex items-center gap-2">
              <span className="text-xs text-brand-medium">Total OFs</span>
              <span className="text-sm font-bold text-white">{totalOFs}</span>
            </div>
            {totalPaletesGeral > 0 && (
              <div className="glass-panel px-4 py-2 flex items-center gap-2">
                <span className="text-xs text-brand-medium">Total paletes</span>
                <span className="text-sm font-bold text-brand-primary">
                  {totalPaletesGeral % 1 === 0
                    ? totalPaletesGeral.toLocaleString("pt-BR")
                    : totalPaletesGeral.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          <div className="glass-table overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr className="table-header">
                  <th className="table-th">Numero da OF</th>
                  <th className="table-th">Ultima movimentacao</th>
                  <th className="table-th">Tipo</th>
                  <th className="table-th-right">Caixas</th>
                  <th className="table-th-right">Paletes</th>
                </tr>
              </thead>
              <tbody>
                {todasOFs.map((row, i) => (
                  <tr
                    key={row.of}
                    onClick={() => setBusca(row.of)}
                    className={`border-b border-brand-border/40 cursor-pointer transition-colors ${i % 2 === 0 ? "table-row-even" : "table-row-odd"} hover:bg-brand-hover/40`}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-white">{row.of}</td>
                    <td className="py-3 px-4 text-brand-medium">{row.data.toLocaleDateString("pt-BR")}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                        row.tipo === "entrada" ? "bg-brand-primary/15 text-brand-primary"
                        : row.tipo === "saida" ? "bg-brand-hover text-brand-light"
                        : "bg-brand-hover text-brand-medium"
                      }`}>
                        {row.tipo}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">{row.totalCaixas.toLocaleString("pt-BR")}</td>
                    <td className="py-3 px-4 text-right font-bold text-brand-primary">
                      {row.totalPaletes > 0
                        ? (row.totalPaletes % 1 === 0
                          ? row.totalPaletes.toLocaleString("pt-BR")
                          : row.totalPaletes.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 }))
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {busca.trim() && resultado.length === 0 && (
        <div className="glass-panel py-16 text-center">
          <p className="text-sm text-brand-light">Nenhuma movimentacao encontrada para essa OF.</p>
        </div>
      )}

      {resumo && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-muted">OF selecionada</p>
              <p className="text-lg font-bold font-mono text-white">{busca.trim()}</p>
            </div>
            <button
              onClick={() => setBusca("")}
              className="text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-150"
              style={{ background: "linear-gradient(135deg, #8B83FF, #6C63FF)", color: "#fff", border: "none", boxShadow: "0 4px 14px rgba(108,99,255,0.3)" }}
            >
              Ver todas as OFs
            </button>
          </div>
          {/* Cards resumo */}
          <div className="grid grid-cols-4 gap-4">
            <div className="glass-panel p-4">
              <p className="text-xs text-brand-medium mb-1">Movimentacoes</p>
              <p className="text-2xl font-bold text-white">{resumo.totalMovs}</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-xs text-brand-medium mb-1">Produtos</p>
              <p className="text-2xl font-bold text-white">{resumo.totalProdutos}</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-xs text-brand-medium mb-1">Total caixas</p>
              <p className="text-2xl font-bold text-brand-primary">{resumo.totalCaixas} cx</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-xs text-brand-medium mb-1">Tipo</p>
              <p className="text-2xl font-bold capitalize text-white">{resumo.tipo}</p>
            </div>
          </div>

          {/* Data */}
          <p className="text-xs text-brand-medium px-1">
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
                    <tr key={i} className={`border-b border-brand-border/40 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}>
                      <td className="py-3 px-4 font-medium text-white">{r.nome}</td>
                      <td className="py-3 px-4 text-right text-brand-primary font-medium">
                        {r.entradas > 0 ? `${r.entradas} ${r.unidade}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-brand-light font-medium">
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

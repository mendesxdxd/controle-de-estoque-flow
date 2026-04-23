"use client";

import { useMemo, useState } from "react";
import { Movimentacao } from "@/types";

type Filtro = "hoje" | "7d" | "6m" | "1a";

const DIAS  = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function localStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mesKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function labelCurto(nome: string) {
  const p = nome.trim().split(" ");
  return p[0].length > 8 ? p[0].slice(0, 8) : p[0];
}

const CHART_H   = 192;
const GRID_STEPS = 4;

const FILTROS: { key: Filtro; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "7d",   label: "7D"   },
  { key: "6m",   label: "6M"   },
  { key: "1a",   label: "1A"   },
];

export default function GraficoEstoque({ movimentacoes }: { movimentacoes: Movimentacao[] }) {
  const [filtro, setFiltro] = useState<Filtro>("6m");
  const [hover,  setHover ] = useState<number | null>(null);

  const { dados, stats } = useMemo(() => {
    const hoje    = new Date();
    const hojeKey = localStr(hoje);
    const ontem   = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    const ontemKey = localStr(ontem);

    type Ponto     = { label: string; tooltip: string; key: string; entradas: number; saidas: number };
    type PontoPrev = { key: string; entradas: number; saidas: number };

    let pontos:     Ponto[]     = [];
    let prevPontos: PontoPrev[] = [];

    if (filtro === "hoje") {
      const mapaHoje:  Record<string, Ponto>     = {};
      const mapaOntem: Record<string, PontoPrev> = {};

      for (const mov of movimentacoes) {
        const d    = new Date(mov.created_at);
        const dKey = localStr(d);
        const nomeCompleto = mov.produtos?.nome ?? "—";
        const pid  = mov.produto_id;

        if (dKey === hojeKey) {
          if (!mapaHoje[pid]) mapaHoje[pid] = { label: labelCurto(nomeCompleto), tooltip: nomeCompleto, key: pid, entradas: 0, saidas: 0 };
          if (mov.tipo === "entrada") mapaHoje[pid].entradas += mov.quantidade;
          else                        mapaHoje[pid].saidas   += mov.quantidade;
        }
        if (dKey === ontemKey) {
          if (!mapaOntem[pid]) mapaOntem[pid] = { key: pid, entradas: 0, saidas: 0 };
          if (mov.tipo === "entrada") mapaOntem[pid].entradas += mov.quantidade;
          else                        mapaOntem[pid].saidas   += mov.quantidade;
        }
      }

      pontos = Object.values(mapaHoje);
      const totalPrevE = Object.values(mapaOntem).reduce((a, p) => a + p.entradas, 0);
      const totalPrevS = Object.values(mapaOntem).reduce((a, p) => a + p.saidas,   0);
      const totalE = pontos.reduce((a, p) => a + p.entradas, 0);
      const totalS = pontos.reduce((a, p) => a + p.saidas,   0);
      const pctE   = totalPrevE > 0 ? Math.round(((totalE - totalPrevE) / totalPrevE) * 100) : null;
      const pctS   = totalPrevS > 0 ? Math.round(((totalS - totalPrevS) / totalPrevS) * 100) : null;
      return { dados: pontos, stats: { totalE, totalS, saldo: totalE - totalS, pctE, pctS } };
    }

    if (filtro === "7d") {
      pontos = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(hoje); d.setDate(d.getDate() - (6 - i));
        return { label: DIAS[d.getDay()], tooltip: DIAS[d.getDay()], key: localStr(d), entradas: 0, saidas: 0 };
      });
      prevPontos = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(hoje); d.setDate(d.getDate() - (13 - i));
        return { key: localStr(d), entradas: 0, saidas: 0 };
      });
    } else {
      const n = filtro === "6m" ? 6 : 12;
      pontos = Array.from({ length: n }, (_, i) => {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - (n - 1 - i), 1);
        return { label: MESES[d.getMonth()], tooltip: MESES[d.getMonth()], key: mesKey(d), entradas: 0, saidas: 0 };
      });
      prevPontos = Array.from({ length: n }, (_, i) => {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - (2 * n - 1 - i), 1);
        return { key: mesKey(d), entradas: 0, saidas: 0 };
      });
    }

    const pontoMap = new Map(pontos.map((p) => [p.key, p]));
    const prevMap  = new Map(prevPontos.map((p) => [p.key, p]));

    for (const mov of movimentacoes) {
      const d   = new Date(mov.created_at);
      const key = filtro === "7d" ? localStr(d) : mesKey(d);
      const p   = pontoMap.get(key);
      if (p) { if (mov.tipo === "entrada") p.entradas += mov.quantidade; else p.saidas += mov.quantidade; }
      const pp  = prevMap.get(key);
      if (pp) { if (mov.tipo === "entrada") pp.entradas += mov.quantidade; else pp.saidas += mov.quantidade; }
    }

    const totalE = pontos.reduce((a, p) => a + p.entradas, 0);
    const totalS = pontos.reduce((a, p) => a + p.saidas,   0);
    const prevE  = prevPontos.reduce((a, p) => a + p.entradas, 0);
    const prevS  = prevPontos.reduce((a, p) => a + p.saidas,   0);
    const pctE   = prevE > 0 ? Math.round(((totalE - prevE) / prevE) * 100) : null;
    const pctS   = prevS > 0 ? Math.round(((totalS - prevS) / prevS) * 100) : null;
    return { dados: pontos, stats: { totalE, totalS, saldo: totalE - totalS, pctE, pctS } };
  }, [movimentacoes, filtro]);

  const maxVal    = Math.max(...dados.map((d) => Math.max(d.entradas, d.saidas)), 1);
  const gridValues = Array.from({ length: GRID_STEPS + 1 }, (_, i) =>
    Math.round((maxVal / GRID_STEPS) * (GRID_STEPS - i))
  );

  const semDados = filtro === "hoje" && dados.length === 0;

  return (
    <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-2xl" style={{ padding: "24px 24px 16px" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm font-bold text-white">
            {filtro === "hoje" ? "Movimentacao de hoje" : "Movimentacao por periodo"}
          </p>
          <p className="text-xs font-medium mt-0.5 text-brand-medium">
            {filtro === "hoje" ? "Entradas e saidas por produto" : "Entradas e saidas"}
          </p>
        </div>
        <div className="flex gap-1.5">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFiltro(f.key); setHover(null); }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-150"
              style={filtro === f.key
                ? { background: "linear-gradient(135deg, #8B83FF, #6C63FF)", color: "#fff", border: "1px solid transparent", boxShadow: "0 4px 12px rgba(108,99,255,0.25)" }
                : { background: "transparent", color: "#3d3a6e", border: "1px solid #252540" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-6 mb-5 pb-4 border-b border-brand-border">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-white">{stats.totalE.toLocaleString("pt-BR")}</span>
            {stats.pctE !== null && (
              <span className="text-xs font-bold" style={{ color: stats.pctE >= 0 ? "#8B83FF" : "#f87171" }}>
                {stats.pctE >= 0 ? "▲" : "▼"} {Math.abs(stats.pctE)}%
              </span>
            )}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Total de entradas</p>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-white">{stats.totalS.toLocaleString("pt-BR")}</span>
            {stats.pctS !== null && (
              <span className="text-xs font-bold" style={{ color: stats.pctS > 0 ? "#f87171" : "#8B83FF" }}>
                {stats.pctS >= 0 ? "▲" : "▼"} {Math.abs(stats.pctS)}%
              </span>
            )}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Total de saidas</p>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-white">{stats.saldo.toLocaleString("pt-BR")}</span>
            <span className="text-xs font-bold text-brand-medium">saldo</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
            {filtro === "hoje" ? "Saldo de hoje" : "Saldo do periodo"}
          </p>
        </div>
      </div>

      {/* Chart */}
      {semDados ? (
        <div className="flex items-center justify-center" style={{ height: `${CHART_H + 28}px` }}>
          <p className="text-sm text-brand-muted">Nenhuma movimentacao hoje.</p>
        </div>
      ) : (
        <div className="relative" style={{ height: `${CHART_H + 28}px` }}>
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between" style={{ paddingBottom: "28px", pointerEvents: "none" }}>
            {gridValues.map((val, i) => (
              <div key={i} className="relative w-full" style={{ borderTop: "1px dashed #252540" }}>
                <span className="absolute text-[10px] font-semibold text-zinc-700" style={{ top: "-9px", left: 0 }}>
                  {val}
                </span>
              </div>
            ))}
          </div>

          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-around" style={{ padding: "0 8px 28px", zIndex: 1 }}>
            {dados.map((ponto, i) => {
              const hE      = Math.round((ponto.entradas / maxVal) * CHART_H);
              const hS      = Math.round((ponto.saidas   / maxVal) * CHART_H);
              const isHover = hover === i;

              return (
                <div
                  key={i}
                  className="relative flex flex-col items-center justify-end flex-1"
                  style={{ height: "100%", gap: "6px", cursor: "pointer" }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                >
                  {isHover && (
                    <div
                      className="absolute z-20 text-xs"
                      style={{
                        background: "#13131f",
                        border: "1px solid #252540",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        bottom: `${Math.max(hE, hS) + 36}px`,
                        left: "50%",
                        transform: "translateX(-50%)",
                        whiteSpace: "nowrap",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                        pointerEvents: "none",
                      }}
                    >
                      <p className="font-bold mb-1.5 text-[11px] text-brand-light">{ponto.tooltip}</p>
                      <p className="text-brand-light">Entradas: <span className="text-white font-bold">{ponto.entradas}</span></p>
                      <p className="text-brand-light">Saidas: <span className="text-white font-bold">{ponto.saidas}</span></p>
                    </div>
                  )}

                  <div className="flex items-end justify-center w-full" style={{ gap: "3px" }}>
                    <div
                      style={{
                        height: `${hE}px`,
                        flex: 1,
                        maxWidth: "18px",
                        background: "linear-gradient(180deg, #8B83FF, #6C63FF)",
                        borderRadius: "6px 6px 2px 2px",
                        transition: "filter 0.15s",
                        filter: isHover ? "brightness(1.2)" : "brightness(1)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ position: "absolute", inset: 0, height: "40%", background: "linear-gradient(to bottom, rgba(255,255,255,0.12), transparent)" }} />
                    </div>
                    <div
                      style={{
                        height: `${hS}px`,
                        flex: 1,
                        maxWidth: "18px",
                        background: "#1a1a2e",
                        border: "1px solid #252540",
                        borderRadius: "6px 6px 2px 2px",
                        transition: "filter 0.15s",
                        filter: isHover ? "brightness(1.4)" : "brightness(1)",
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-brand-muted">{ponto.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-brand-border">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-medium">
          <div style={{ width: 10, height: 10, borderRadius: 3, background: "linear-gradient(135deg, #818cf8, #4f46e5)" }} />
          Entradas
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-medium">
          <div style={{ width: 10, height: 10, borderRadius: 3, background: "#27272a", border: "1px solid rgba(255,255,255,0.08)" }} />
          Saidas
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Movimentacao } from "@/types";

type Filtro = "7d" | "6m" | "1a";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function localStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mesKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const CHART_H = 192;
const GRID_STEPS = 4;

export default function GraficoEstoque({ movimentacoes }: { movimentacoes: Movimentacao[] }) {
  const [filtro, setFiltro] = useState<Filtro>("6m");
  const [hover, setHover] = useState<number | null>(null);

  const { dados, stats } = useMemo(() => {
    const hoje = new Date();

    type Ponto = { label: string; key: string; entradas: number; saidas: number };
    type PontoPrev = { key: string; entradas: number; saidas: number };

    let pontos: Ponto[] = [];
    let prevPontos: PontoPrev[] = [];

    if (filtro === "7d") {
      pontos = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(hoje);
        d.setDate(d.getDate() - (6 - i));
        return { label: DIAS[d.getDay()], key: localStr(d), entradas: 0, saidas: 0 };
      });
      prevPontos = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(hoje);
        d.setDate(d.getDate() - (13 - i));
        return { key: localStr(d), entradas: 0, saidas: 0 };
      });
    } else {
      const n = filtro === "6m" ? 6 : 12;
      pontos = Array.from({ length: n }, (_, i) => {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - (n - 1 - i), 1);
        return { label: MESES[d.getMonth()], key: mesKey(d), entradas: 0, saidas: 0 };
      });
      prevPontos = Array.from({ length: n }, (_, i) => {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - (2 * n - 1 - i), 1);
        return { key: mesKey(d), entradas: 0, saidas: 0 };
      });
    }

    const pontoMap = new Map(pontos.map((p) => [p.key, p]));
    const prevMap = new Map(prevPontos.map((p) => [p.key, p]));

    for (const mov of movimentacoes) {
      const d = new Date(mov.created_at);
      const key = filtro === "7d" ? localStr(d) : mesKey(d);
      const p = pontoMap.get(key);
      if (p) {
        if (mov.tipo === "entrada") p.entradas += mov.quantidade;
        else p.saidas += mov.quantidade;
      }
      const pp = prevMap.get(key);
      if (pp) {
        if (mov.tipo === "entrada") pp.entradas += mov.quantidade;
        else pp.saidas += mov.quantidade;
      }
    }

    const totalE = pontos.reduce((acc, p) => acc + p.entradas, 0);
    const totalS = pontos.reduce((acc, p) => acc + p.saidas, 0);
    const prevE = prevPontos.reduce((acc, p) => acc + p.entradas, 0);
    const prevS = prevPontos.reduce((acc, p) => acc + p.saidas, 0);
    const pctE = prevE > 0 ? Math.round(((totalE - prevE) / prevE) * 100) : null;
    const pctS = prevS > 0 ? Math.round(((totalS - prevS) / prevS) * 100) : null;

    return { dados: pontos, stats: { totalE, totalS, saldo: totalE - totalS, pctE, pctS } };
  }, [movimentacoes, filtro]);

  const maxVal = Math.max(...dados.map((d) => Math.max(d.entradas, d.saidas)), 1);
  const gridValues = Array.from({ length: GRID_STEPS + 1 }, (_, i) =>
    Math.round((maxVal / GRID_STEPS) * (GRID_STEPS - i))
  );

  return (
    <div style={{ background: "#13131f", border: "1px solid #2a2550", borderRadius: "16px", padding: "24px 24px 16px" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm font-bold text-white">Movimentacao por periodo</p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: "#534AB7" }}>Entradas e saidas</p>
        </div>
        <div className="flex gap-1.5">
          {(["7d", "6m", "1a"] as Filtro[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-150"
              style={filtro === f
                ? { background: "linear-gradient(135deg, #7F77DD, #4B3FC7)", color: "#fff", border: "1px solid transparent", boxShadow: "0 4px 12px rgba(127,119,221,0.3)" }
                : { background: "transparent", color: "#AFA9EC", border: "1px solid #2a2550" }
              }
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-6 mb-5 pb-4" style={{ borderBottom: "1px solid #1a1830" }}>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-white">{stats.totalE.toLocaleString("pt-BR")}</span>
            {stats.pctE !== null && (
              <span className="text-xs font-bold" style={{ color: stats.pctE >= 0 ? "#7F77DD" : "#E24B4A" }}>
                {stats.pctE >= 0 ? "▲" : "▼"} {Math.abs(stats.pctE)}%
              </span>
            )}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#534AB7" }}>Total de entradas</p>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-white">{stats.totalS.toLocaleString("pt-BR")}</span>
            {stats.pctS !== null && (
              <span className="text-xs font-bold" style={{ color: stats.pctS > 0 ? "#E24B4A" : "#7F77DD" }}>
                {stats.pctS >= 0 ? "▲" : "▼"} {Math.abs(stats.pctS)}%
              </span>
            )}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#534AB7" }}>Total de saidas</p>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-white">{stats.saldo.toLocaleString("pt-BR")}</span>
            <span className="text-xs font-bold" style={{ color: "#7F77DD" }}>saldo</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#534AB7" }}>Saldo do periodo</p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: `${CHART_H + 28}px` }}>
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between" style={{ paddingBottom: "28px", pointerEvents: "none" }}>
          {gridValues.map((val, i) => (
            <div key={i} className="relative w-full" style={{ borderTop: "1px dashed #1e1c3a" }}>
              <span className="absolute text-[10px] font-semibold" style={{ color: "#2a2550", top: "-9px", left: 0 }}>
                {val}
              </span>
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="absolute inset-0 flex items-end justify-around" style={{ padding: "0 8px 28px", zIndex: 1 }}>
          {dados.map((ponto, i) => {
            const hE = Math.round((ponto.entradas / maxVal) * CHART_H);
            const hS = Math.round((ponto.saidas / maxVal) * CHART_H);
            const isHover = hover === i;

            return (
              <div
                key={i}
                className="relative flex flex-col items-center justify-end flex-1"
                style={{ height: "100%", gap: "6px", cursor: "pointer" }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {/* Tooltip */}
                {isHover && (
                  <div
                    className="absolute z-20 text-xs"
                    style={{
                      background: "#1a1830",
                      border: "1px solid #3a3470",
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
                    <p className="font-bold mb-1.5 text-[11px]" style={{ color: "#AFA9EC" }}>{ponto.label}</p>
                    <p style={{ color: "#AFA9EC" }}>Entradas: <span className="text-white font-bold">{ponto.entradas}</span></p>
                    <p style={{ color: "#AFA9EC" }}>Saidas: <span className="text-white font-bold">{ponto.saidas}</span></p>
                  </div>
                )}

                <div className="flex items-end justify-center w-full" style={{ gap: "3px" }}>
                  {/* Barra entrada */}
                  <div
                    style={{
                      height: `${hE}px`,
                      flex: 1,
                      maxWidth: "18px",
                      background: "linear-gradient(180deg, #AFA9EC, #534AB7)",
                      borderRadius: "6px 6px 2px 2px",
                      transition: "filter 0.15s",
                      filter: isHover ? "brightness(1.25)" : "brightness(1)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ position: "absolute", inset: 0, top: 0, height: "40%", background: "linear-gradient(to bottom, rgba(255,255,255,0.12), transparent)" }} />
                  </div>
                  {/* Barra saida */}
                  <div
                    style={{
                      height: `${hS}px`,
                      flex: 1,
                      maxWidth: "18px",
                      background: "#1e1c3a",
                      border: "1px solid #2a2550",
                      borderRadius: "6px 6px 2px 2px",
                      transition: "filter 0.15s",
                      filter: isHover ? "brightness(1.4)" : "brightness(1)",
                    }}
                  />
                </div>
                <span className="text-[11px] font-bold" style={{ color: "#534AB7" }}>{ponto.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: "1px solid #1a1830" }}>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#AFA9EC" }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: "linear-gradient(135deg, #7F77DD, #4B3FC7)" }} />
          Entradas
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#AFA9EC" }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: "#2a2550" }} />
          Saidas
        </div>
      </div>
    </div>
  );
}

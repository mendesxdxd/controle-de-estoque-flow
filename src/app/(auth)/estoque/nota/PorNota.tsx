"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Movimentacao } from "@/types";

const MESES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const [y] = value.split("-").map(Number);
    return y || new Date().getFullYear();
  });
  const ref = useRef<HTMLDivElement>(null);
  const now = new Date();

  const [selYear, selMonth] = value ? value.split("-").map(Number) : [0, 0];
  const label = selYear && selMonth
    ? MESES[selMonth - 1].charAt(0).toUpperCase() + MESES[selMonth - 1].slice(1) + " " + selYear
    : "Selecionar mes";

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function selectMonth(idx: number) {
    onChange(`${viewYear}-${String(idx + 1).padStart(2, "0")}`);
    setTimeout(() => setOpen(false), 160);
  }

  function goThisMonth() {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    onChange(`${y}-${m}`);
    setViewYear(y);
    setTimeout(() => setOpen(false), 160);
  }

  function clearMonth() {
    const d = new Date();
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setOpen(false);
  }

  const navBtn: React.CSSProperties = {
    width: 24, height: 24, borderRadius: 6, border: "1px solid #252540",
    background: "#1a1a2e", color: "#8B83FF", fontSize: 14, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 200, background: "#13131f",
          border: `1px solid ${open ? "#6C63FF" : "#3d3a6e"}`,
          borderRadius: 10, padding: "9px 14px", color: "#fff",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: open ? "0 0 0 3px rgba(108,99,255,0.15)" : "none",
          userSelect: "none", transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        <span>{label}</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.7 }}>
          <rect x="1" y="1.5" width="12" height="11" rx="2.5" stroke="#8B83FF" strokeWidth="1.3"/>
          <path d="M1 5h12" stroke="#8B83FF" strokeWidth="1.3"/>
          <path d="M4.5 0v2M9.5 0v2" stroke="#8B83FF" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, width: 220,
          background: "#13131f", border: "1px solid #252540", borderRadius: 12,
          padding: 14, boxShadow: "0 16px 40px rgba(0,0,0,0.6)", zIndex: 1000,
        }}>
          {/* year nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button style={navBtn} onClick={() => setViewYear((y) => y - 1)}>‹</button>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{viewYear}</span>
            <button style={navBtn} onClick={() => setViewYear((y) => y + 1)}>›</button>
          </div>

          {/* month grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4, marginBottom: 12 }}>
            {MESES.map((m, i) => {
              const isSel = selYear === viewYear && selMonth === i + 1;
              const isCur = viewYear === now.getFullYear() && i === now.getMonth();
              return (
                <button
                  key={m}
                  onClick={() => selectMonth(i)}
                  style={{
                    padding: "7px 4px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                    textAlign: "center", cursor: "pointer",
                    background: isSel ? "#6C63FF" : "transparent",
                    color: isSel ? "#fff" : isCur ? "#B3AEFF" : "#8B83FF",
                    border: isSel ? "1px solid transparent" : isCur ? "1px solid #3d3a6e" : "1px solid transparent",
                    boxShadow: isSel ? "0 3px 10px rgba(108,99,255,0.4)" : "none",
                    transition: "all 0.12s",
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* footer */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #1a1a2e" }}>
            <button onClick={clearMonth} style={{ fontSize: 11, fontWeight: 700, cursor: "pointer", background: "none", border: "none", color: "#3d3a6e" }}>Limpar</button>
            <button onClick={goThisMonth} style={{ fontSize: 11, fontWeight: 700, cursor: "pointer", background: "none", border: "none", color: "#6C63FF" }}>Este mes</button>
          </div>
        </div>
      )}
    </div>
  );
}

type Props = { movimentacoes: Movimentacao[] };

function fmtPaletes(n: number): string {
  if (n <= 0) return "—";
  return n % 1 === 0
    ? n.toLocaleString("pt-BR")
    : n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

function mesAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function gerarMensagemMensal(
  linhas: { of: string; data: Date; totalPaletes: number }[],
  mes: string
): string {
  const [ano, m] = mes.split("-");
  const nomeMes = new Date(Number(ano), Number(m) - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .toUpperCase();

  const totalPal = linhas.reduce((acc, r) => acc + r.totalPaletes, 0);

  const itens = linhas.length > 0
    ? linhas.map((row) => {
        const data = row.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        return `${row.of} - ${data} - ${fmtPaletes(row.totalPaletes)} paletes`;
      })
    : ["Nenhuma OF neste mes."];

  return [
    `*RELATORIO DE OFS - ${nomeMes}*`,
    ``,
    ...itens,
    ``,
    linhas.length > 0 ? `*Total: ${linhas.length} OFs | ${fmtPaletes(totalPal)} paletes*` : null,
  ].filter((l) => l !== null).join("\n");
}

export default function PorNota({ movimentacoes }: Props) {
  const [busca, setBusca] = useState("");
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual);
  const [copiado, setCopiado] = useState(false);

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

  const relatorioMes = useMemo(() => {
    const [ano, mes] = mesSelecionado.split("-").map(Number);
    const movsFiltrados = movimentacoes.filter((mov) => {
      if (!mov.nota_fiscal?.trim()) return false;
      const d = new Date(mov.created_at);
      return d.getFullYear() === ano && d.getMonth() + 1 === mes;
    });

    const mapa: Record<string, { of: string; data: Date; totalPaletes: number }> = {};
    for (const mov of movsFiltrados) {
      const of = mov.nota_fiscal!.trim();
      if (!mapa[of]) mapa[of] = { of, data: new Date(mov.created_at), totalPaletes: 0 };
      const cxPalete = mov.produtos?.caixas_por_palete;
      if (cxPalete && cxPalete > 0) mapa[of].totalPaletes += mov.quantidade / cxPalete;
      if (new Date(mov.created_at) > mapa[of].data) mapa[of].data = new Date(mov.created_at);
    }

    const linhas = Object.values(mapa).sort((a, b) => b.data.getTime() - a.data.getTime());
    return { linhas, totalPaletes: linhas.reduce((acc, r) => acc + r.totalPaletes, 0) };
  }, [movimentacoes, mesSelecionado]);

  async function handleCopiarRelatorio() {
    const texto = gerarMensagemMensal(relatorioMes.linhas, mesSelecionado);
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Linha de busca + stats + controles relatorio */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Buscar OF</label>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Ex: 6100181424"
            className="input-field"
            style={{ minWidth: 200 }}
          />
          {!busca.trim() && (
            <div className="flex items-center gap-2">
              <div className="glass-panel px-3 py-1.5 flex items-center gap-1.5">
                <span className="text-xs text-brand-medium">OFs</span>
                <span className="text-sm font-bold text-white">{totalOFs}</span>
              </div>
              {totalPaletesGeral > 0 && (
                <div className="glass-panel px-3 py-1.5 flex items-center gap-1.5">
                  <span className="text-xs text-brand-medium">Paletes</span>
                  <span className="text-sm font-bold text-brand-primary">{fmtPaletes(totalPaletesGeral)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controles relatorio mensal */}
        <div className="flex items-center gap-2 flex-wrap">
          <MonthPicker value={mesSelecionado} onChange={setMesSelecionado} />
          <button
            onClick={handleCopiarRelatorio}
            className="text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-150"
            style={{ background: "linear-gradient(135deg, #8B83FF, #6C63FF)", color: "#fff", boxShadow: "0 4px 14px rgba(108,99,255,0.3)" }}
          >
            Copiar relatorio
          </button>

          {typeof document !== "undefined" && createPortal(
            <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 9999 }}>
              <div style={{
                background: "rgba(108,99,255,0.15)",
                border: "1px solid rgba(108,99,255,0.4)",
                color: "#a89aff",
                borderRadius: "12px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 600,
                backdropFilter: "blur(8px)",
                transition: "opacity 0.25s ease, transform 0.25s ease",
                opacity: copiado ? 1 : 0,
                transform: copiado ? "translateY(0px)" : "translateY(6px)",
              }}>
                Relatorio copiado!
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>

      {/* Tabela geral */}
      {!busca.trim() && todasOFs.length > 0 && (
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
                  <td className="py-3 px-4 text-right font-bold text-brand-primary">{fmtPaletes(row.totalPaletes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <p className="text-xs text-brand-medium px-1">
            {resumo.dataMin.toLocaleDateString("pt-BR") === resumo.dataMax.toLocaleDateString("pt-BR")
              ? `Data: ${resumo.dataMin.toLocaleDateString("pt-BR")}`
              : `Periodo: ${resumo.dataMin.toLocaleDateString("pt-BR")} — ${resumo.dataMax.toLocaleDateString("pt-BR")}`
            }
          </p>
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
"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const MESES = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const PANEL_HEIGHT = 390;
const PANEL_WIDTH  = 280;

type Props = {
  value: string;
  onChange: (date: string) => void;
};

export default function DatePicker({ value, onChange }: Props) {
  const hoje = new Date();
  const [aberto, setAberto] = useState(false);
  const [viewYear, setViewYear] = useState(hoje.getFullYear());
  const [viewMonth, setViewMonth] = useState(hoje.getMonth());
  const [pendingDate, setPendingDate] = useState<Date | null>(
    value ? new Date(value + "T12:00:00") : null
  );
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        ref.current && !ref.current.contains(e.target as Node)
      ) setAberto(false);
    }
    function handleScroll() { setAberto(false); }
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  function abrirPanel() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= PANEL_HEIGHT + 8
        ? rect.bottom + 6
        : rect.top - PANEL_HEIGHT - 6;
      setPos({ top, left: rect.left });
    }
    setAberto(!aberto);
  }

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev  = new Date(viewYear, viewMonth, 0).getDate();
  const total       = firstDay + daysInMonth;
  const remaining   = total % 7 === 0 ? 0 : 7 - (total % 7);

  function changeMonth(dir: number) {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setViewMonth(m);
    setViewYear(y);
  }

  function selectDay(d: number) {
    setPendingDate(new Date(viewYear, viewMonth, d));
  }

  function confirmar() {
    if (!pendingDate) return;
    const str = `${pendingDate.getFullYear()}-${String(pendingDate.getMonth() + 1).padStart(2, "0")}-${String(pendingDate.getDate()).padStart(2, "0")}`;
    onChange(str);
    setAberto(false);
  }

  function limpar() {
    const t = new Date();
    const str = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    setPendingDate(new Date(t.getFullYear(), t.getMonth(), t.getDate()));
    onChange(str);
    setAberto(false);
  }

  function formatarLabel() {
    const d = value ? new Date(value + "T12:00:00") : null;
    if (!d) return "Selecionar data";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  }

  function isToday(d: number) {
    return d === hoje.getDate() && viewMonth === hoje.getMonth() && viewYear === hoje.getFullYear();
  }

  function isPending(d: number) {
    return !!pendingDate &&
      d === pendingDate.getDate() &&
      viewMonth === pendingDate.getMonth() &&
      viewYear === pendingDate.getFullYear();
  }

  const btnNav: React.CSSProperties = {
    width: 30, height: 30, borderRadius: 8,
    border: "1px solid #252540", background: "#1a1a2e",
    color: "#8B83FF", fontSize: 18, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s",
  };

  return (
    <div ref={triggerRef} className="relative">
      {/* Trigger */}
      <div
        onClick={abrirPanel}
        style={{
          background: "#13131f",
          border: `1px solid ${aberto ? "#6C63FF" : "#252540"}`,
          borderRadius: "10px",
          boxShadow: aberto ? "0 0 0 3px rgba(108,99,255,0.15)" : "none",
          width: "220px",
          padding: "11px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", transition: "all 0.2s", userSelect: "none",
        }}
      >
        <span className="text-white text-sm font-semibold">{formatarLabel()}</span>
        <svg style={{ opacity: 0.6 }} width="15" height="15" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="2" width="14" height="13" rx="3" stroke="#8B83FF" strokeWidth="1.5"/>
          <path d="M1 6h14" stroke="#8B83FF" strokeWidth="1.5"/>
          <path d="M5 1v2M11 1v2" stroke="#8B83FF" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {aberto && typeof window !== "undefined" && createPortal(
        <div
          ref={ref}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            background: "#13131f",
            border: "1px solid #252540",
            borderRadius: "16px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(108,99,255,0.08)",
            width: `${PANEL_WIDTH}px`,
            padding: "20px",
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <button style={btnNav} onClick={() => changeMonth(-1)}>‹</button>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
              {MESES[viewMonth]} {viewYear}
            </span>
            <button style={btnNav} onClick={() => changeMonth(1)}>›</button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7" style={{ marginBottom: 8 }}>
            {["D","S","T","Q","Q","S","S"].map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#3d3a6e", padding: "4px 0", letterSpacing: "0.5px" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7" style={{ gap: 2 }}>
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`prev-${i}`} className="aspect-square flex items-center justify-center" style={{ fontSize: 13, color: "#252540" }}>
                {daysInPrev - firstDay + i + 1}
              </div>
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const d        = i + 1;
              const selected = isPending(d);
              const today    = isToday(d);
              return (
                <div
                  key={d}
                  onClick={() => selectDay(d)}
                  className="aspect-square flex items-center justify-center cursor-pointer transition-all"
                  style={{
                    fontSize: 13, fontWeight: 600, borderRadius: 8,
                    background: selected
                      ? "linear-gradient(135deg, #8B83FF, #6C63FF)"
                      : today ? "rgba(108,99,255,0.1)" : "transparent",
                    color: selected ? "#fff" : today ? "#8B83FF" : "#B3AEFF",
                    border: today && !selected ? "1px solid #6C63FF" : "1px solid transparent",
                    boxShadow: selected ? "0 4px 14px rgba(108,99,255,0.4)" : "none",
                  }}
                >
                  {d}
                </div>
              );
            })}

            {Array.from({ length: remaining }, (_, i) => (
              <div key={`next-${i}`} className="aspect-square flex items-center justify-center" style={{ fontSize: 13, color: "#252540" }}>
                {i + 1}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#252540", margin: "16px 0 14px" }} />

          {/* Footer */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={limpar}
              style={{
                flex: 1, padding: "8px", borderRadius: 8,
                background: "transparent", border: "1px solid #252540",
                color: "#8B83FF", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
              className="hover:bg-brand-hover transition-all duration-150"
            >
              Hoje
            </button>
            <button
              onClick={confirmar}
              style={{
                flex: 1, padding: "8px", borderRadius: 8,
                background: "linear-gradient(135deg, #8B83FF, #6C63FF)",
                color: "#fff", fontSize: 13, fontWeight: 700,
                boxShadow: "0 4px 14px rgba(108,99,255,0.3)",
                border: "none", cursor: "pointer",
              }}
            >
              Confirmar
            </button>
          </div>
        </div>
      , document.body)}
    </div>
  );
}

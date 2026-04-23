"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const MESES = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const PANEL_HEIGHT = 280;
const PANEL_WIDTH = 280;

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
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
  const total = firstDay + daysInMonth;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);

  function changeMonth(dir: number) {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
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

  return (
    <div ref={triggerRef} className="relative">
      <div
        onClick={abrirPanel}
        style={{
          background: "#13131f",
          border: `1px solid ${aberto ? "#7F77DD" : "#3a3470"}`,
          borderRadius: "8px",
          boxShadow: aberto ? "0 0 0 2px rgba(127,119,221,0.15)" : "none",
          width: "210px",
        }}
        className="px-3 py-2 flex items-center justify-between cursor-pointer transition-all duration-200 select-none"
      >
        <span className="text-white text-xs font-semibold">{formatarLabel()}</span>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="2" width="14" height="13" rx="3" stroke="#AFA9EC" strokeWidth="1.5"/>
          <path d="M1 6h14" stroke="#AFA9EC" strokeWidth="1.5"/>
          <path d="M5 1v2M11 1v2" stroke="#AFA9EC" strokeWidth="1.5" strokeLinecap="round"/>
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
            border: "1px solid #2a2550",
            borderRadius: "12px",
            boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(127,119,221,0.08)",
            width: `${PANEL_WIDTH}px`,
            zIndex: 9999,
          }}
          className="p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => changeMonth(-1)}
              style={{ background: "#1a1830", border: "1px solid #2a2550", borderRadius: "6px", color: "#AFA9EC" }}
              className="w-6 h-6 flex items-center justify-center text-base leading-none transition-all hover:text-white"
            >
              ‹
            </button>
            <span className="text-[11px] font-bold text-white">
              {MESES[viewMonth]} {viewYear}
            </span>
            <button
              onClick={() => changeMonth(1)}
              style={{ background: "#1a1830", border: "1px solid #2a2550", borderRadius: "6px", color: "#AFA9EC" }}
              className="w-6 h-6 flex items-center justify-center text-base leading-none transition-all hover:text-white"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {["D","S","T","Q","Q","S","S"].map((d, i) => (
              <div key={i} className="text-center text-[9px] font-bold py-0.5" style={{ color: "#534AB7" }}>
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px">
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`prev-${i}`} className="h-8 flex items-center justify-center text-[10px]" style={{ color: "#2a2550" }}>
                {daysInPrev - firstDay + i + 1}
              </div>
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1;
              const selected = isPending(d);
              const today = isToday(d);
              return (
                <div
                  key={d}
                  onClick={() => selectDay(d)}
                  className="h-8 flex items-center justify-center text-[10px] font-semibold cursor-pointer transition-all"
                  style={{
                    borderRadius: "5px",
                    background: selected ? "linear-gradient(135deg, #7F77DD, #4B3FC7)" : today ? "rgba(83,74,183,0.1)" : "transparent",
                    color: selected ? "#fff" : today ? "#AFA9EC" : "#bbb",
                    border: today && !selected ? "1px solid #534AB7" : "1px solid transparent",
                    boxShadow: selected ? "0 2px 6px rgba(127,119,221,0.35)" : "none",
                  }}
                >
                  {d}
                </div>
              );
            })}

            {Array.from({ length: remaining }, (_, i) => (
              <div key={`next-${i}`} className="h-8 flex items-center justify-center text-[10px]" style={{ color: "#2a2550" }}>
                {i + 1}
              </div>
            ))}
          </div>

          <div style={{ height: "1px", background: "#1e1c3a" }} className="my-2" />

          <div className="flex gap-2">
            <button
              onClick={limpar}
              style={{ background: "transparent", border: "1px solid #2a2550", color: "#AFA9EC", borderRadius: "6px" }}
              className="flex-1 py-1.5 text-[10px] font-bold transition-all hover:border-[#534AB7]"
            >
              Hoje
            </button>
            <button
              onClick={confirmar}
              style={{ background: "linear-gradient(135deg, #7F77DD, #4B3FC7)", color: "#fff", borderRadius: "6px", boxShadow: "0 2px 8px rgba(127,119,221,0.3)" }}
              className="flex-1 py-1.5 text-[10px] font-bold"
            >
              Ok
            </button>
          </div>
        </div>
      , document.body)}
    </div>
  );
}

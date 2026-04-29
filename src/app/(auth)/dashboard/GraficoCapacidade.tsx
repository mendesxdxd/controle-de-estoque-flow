"use client";

import { EstoqueAtualRow } from "@/types";

type Props = {
  estoqueAtual: EstoqueAtualRow[];
  capacidadeArmazem: number;
};

const CX = 90, CY = 90, RO = 72, RI = 52;
const GAP  = 0.025;
const FULL = 2 * Math.PI;

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

function arcPath(startA: number, endA: number): string {
  const large = endA - startA > Math.PI ? 1 : 0;
  const pt = (a: number, rad: number) => ({ x: r4(CX + rad * Math.cos(a)), y: r4(CY + rad * Math.sin(a)) });
  const o1 = pt(startA, RO), o2 = pt(endA, RO);
  const i1 = pt(endA,   RI), i2 = pt(startA, RI);
  return `M${o1.x},${o1.y} A${RO},${RO} 0 ${large} 1 ${o2.x},${o2.y} L${i1.x},${i1.y} A${RI},${RI} 0 ${large} 0 ${i2.x},${i2.y} Z`;
}

export default function GraficoCapacidade({ estoqueAtual, capacidadeArmazem }: Props) {
  const totalPaletes = estoqueAtual.reduce((acc, row) => {
    if (!row.caixas_por_palete) return acc;
    return acc + row.estoque_atual / row.caixas_por_palete;
  }, 0);

  const disponivel = Math.max(capacidadeArmazem - totalPaletes, 0);
  const pct        = capacidadeArmazem > 0 ? Math.min(totalPaletes / capacidadeArmazem, 1) : 0;

  const endOcup   = FULL * pct - GAP;
  const startDisp = FULL * pct + GAP;
  const hasOcup   = endOcup > 0;
  const hasDisp   = startDisp < FULL - GAP * 0.5;

  return (
    <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-2xl" style={{ padding: "22px 28px 28px" }}>
      <p className="text-sm font-bold text-white" style={{ paddingBottom: "16px", borderBottom: "1px solid #252540", marginBottom: "24px" }}>
        Capacidade do galpao
      </p>

      {/* Donut */}
      <div style={{ position: "relative", width: 180, height: 180, margin: "0 auto 32px" }}>
        <svg
          width="180"
          height="180"
          viewBox="0 0 180 180"
          style={{ transform: "rotate(-90deg)", filter: "drop-shadow(0 0 20px rgba(108,99,255,0.2))" }}
        >
          <defs>
            <linearGradient id="capGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8B83FF" />
              <stop offset="100%" stopColor="#6C63FF" />
            </linearGradient>
          </defs>

          {/* Background ring */}
          <circle cx={CX} cy={CY} r={(RO + RI) / 2} fill="none" stroke="#1a1a2e" strokeWidth={RO - RI} />

          {/* Occupied arc */}
          {hasOcup && <path d={arcPath(0, endOcup)} fill="url(#capGrad)" />}

          {/* Available arc */}
          {hasDisp && <path d={arcPath(startDisp, FULL - GAP * 0.5)} fill="#252540" />}
        </svg>

        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span className="text-white font-bold" style={{ fontSize: 28, lineHeight: 1 }}>
            {(pct * 100).toFixed(1).replace(".", ",")}%
          </span>
          <span className="text-brand-medium font-semibold" style={{ fontSize: 11, letterSpacing: "0.5px", marginTop: 4, textTransform: "uppercase" }}>
            ocupado
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", justifyContent: "space-around", paddingTop: 20, borderTop: "1px solid #252540" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6C63FF", marginBottom: 2 }} />
          <span className="text-white font-bold" style={{ fontSize: 22 }}>
            {Math.round(totalPaletes).toLocaleString("pt-BR")}
          </span>
          <span className="text-brand-muted font-semibold" style={{ fontSize: 11, letterSpacing: "0.3px" }}>paletes ocupados</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#252540", marginBottom: 2 }} />
          <span className="text-white font-bold" style={{ fontSize: 22 }}>
            {Math.round(disponivel).toLocaleString("pt-BR")}
          </span>
          <span className="text-brand-muted font-semibold" style={{ fontSize: 11, letterSpacing: "0.3px" }}>disponiveis</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#8B83FF", marginBottom: 2 }} />
          <span className="text-white font-bold" style={{ fontSize: 22 }}>
            {capacidadeArmazem.toLocaleString("pt-BR")}
          </span>
          <span className="text-brand-muted font-semibold" style={{ fontSize: 11, letterSpacing: "0.3px" }}>capacidade total</span>
        </div>
      </div>
    </div>
  );
}

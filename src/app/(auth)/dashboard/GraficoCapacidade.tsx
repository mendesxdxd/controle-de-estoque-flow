"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { EstoqueAtualRow } from "@/types";

const CAPACIDADE_ARMAZEM = 1700;

type Props = {
  estoqueAtual: EstoqueAtualRow[];
};

export default function GraficoCapacidade({ estoqueAtual }: Props) {
  const totalPaletes = estoqueAtual.reduce((acc, r) => {
    if (!r.caixas_por_palete) return acc;
    return acc + r.estoque_atual / r.caixas_por_palete;
  }, 0);

  const disponivel = Math.max(CAPACIDADE_ARMAZEM - totalPaletes, 0);
  const percentual = Math.min((totalPaletes / CAPACIDADE_ARMAZEM) * 100, 100);

  const dados = [
    { nome: "Ocupado", valor: Number(totalPaletes.toFixed(1)) },
    { nome: "Disponivel", valor: Number(disponivel.toFixed(1)) },
  ];

  const cor = percentual >= 90 ? "#f87171" : percentual >= 70 ? "#fbbf24" : "#6366f1";

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="relative w-full" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={85}
              startAngle={90}
              endAngle={-270}
              dataKey="valor"
              strokeWidth={0}
            >
              <Cell fill={cor} />
              <Cell fill="#52525b" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-white tabular-nums">
            {percentual.toFixed(1).replace(".", ",")}%
          </span>
          <span className="text-xs text-zinc-500">ocupado</span>
        </div>
      </div>

      <div className="flex w-full justify-around text-center">
        <div>
          <p className="text-lg font-bold text-white tabular-nums">
            {Number(totalPaletes.toFixed(1)).toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-zinc-500">paletes ocupados</p>
        </div>
        <div className="w-px bg-white/[0.06]" />
        <div>
          <p className="text-lg font-bold text-white tabular-nums">
            {Number(disponivel.toFixed(1)).toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-zinc-500">disponiveis</p>
        </div>
        <div className="w-px bg-white/[0.06]" />
        <div>
          <p className="text-lg font-bold text-white tabular-nums">
            {CAPACIDADE_ARMAZEM.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-zinc-500">capacidade total</p>
        </div>
      </div>
    </div>
  );
}

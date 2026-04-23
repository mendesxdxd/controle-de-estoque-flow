"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Movimentacao } from "@/types";

type Props = {
  movimentacoes: Movimentacao[];
};

export default function GraficoMovimentacoes({ movimentacoes }: Props) {
  const mapa: Record<string, { nome: string; entrada: number; saida: number }> = {};

  movimentacoes.forEach((m) => {
    const nome = m.produtos?.nome ?? "Desconhecido";
    if (!mapa[nome]) mapa[nome] = { nome, entrada: 0, saida: 0 };
    if (m.tipo === "entrada") mapa[nome].entrada += m.quantidade;
    else mapa[nome].saida += m.quantidade;
  });

  const dados = Object.values(mapa);

  if (dados.length === 0) {
    return (
      <p className="text-sm text-brand-medium p-5">Nenhuma movimentacao hoje.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={dados} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
        <XAxis
          dataKey="nome"
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: 8,
            color: "#fff",
            fontSize: 12,
          }}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#71717a", paddingTop: 8 }}
        />
        <Bar dataKey="entrada" name="Entrada" fill="#6366f1" radius={[4, 4, 0, 0]} />
        <Bar dataKey="saida" name="Saida" fill="#a1a1aa" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

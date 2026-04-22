"use client";

import { useState } from "react";
import { Movimentacao, Produto } from "@/types";
import FormularioMovimentacao from "./FormularioMovimentacao";
import { excluirMovimentacao } from "./actions";
import Toast from "@/components/shared/Toast";

type Props = {
  movimentacoes: Movimentacao[];
  produtos: Produto[];
  notaObrigatoria: boolean;
};

export default function TabelaEstoque({ movimentacoes, produtos, notaObrigatoria }: Props) {
  const [abrirForm, setAbrirForm] = useState(false);
  const [tipoInicial, setTipoInicial] = useState<"entrada" | "saida">("entrada");

  const saldoPorProduto = movimentacoes.reduce<Record<string, number>>((acc, mov) => {
    acc[mov.produto_id] = (acc[mov.produto_id] ?? 0) + (mov.tipo === "entrada" ? mov.quantidade : -mov.quantidade);
    return acc;
  }, {});
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function handleNova(tipo: "entrada" | "saida") {
    setTipoInicial(tipo);
    setAbrirForm(true);
  }

  function handleFechar() {
    setAbrirForm(false);
  }

  async function handleExcluir(id: string) {
    if (!confirm("Deseja excluir esta movimentacao?")) return;
    setExcluindo(id);
    const resultado = await excluirMovimentacao(id);
    setExcluindo(null);
    if (resultado?.erro) {
      setToast(resultado.erro);
    } else {
      setToast("Movimentacao excluida.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-3">
        <button onClick={() => handleNova("saida")} className="btn-secondary">
          Registrar saida
        </button>
        <button onClick={() => handleNova("entrada")} className="btn-primary">
          Registrar entrada
        </button>
      </div>

      {abrirForm && (
        <FormularioMovimentacao
          produtos={produtos}
          saldoPorProduto={saldoPorProduto}
          tipoInicial={tipoInicial}
          notaObrigatoria={notaObrigatoria}
          onFechar={handleFechar}
          onSucesso={() => setToast("Movimentacao registrada.")}
        />
      )}

      {movimentacoes.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">Nenhuma movimentacao registrada.</p>
          <button onClick={() => handleNova("entrada")} className="btn-primary">
            Registrar primeira entrada
          </button>
        </div>
      ) : (
        <div className="glass-table overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="table-header">
                <th className="table-th">Data</th>
                <th className="table-th">Produto</th>
                <th className="table-th">Tipo</th>
                <th className="table-th-right">Quantidade</th>
                <th className="table-th">Observacao</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {movimentacoes.map((mov, i) => (
                <tr
                  key={mov.id}
                  className={`border-b border-white/[0.04] ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}
                >
                  <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                    <div>{new Date(mov.created_at).toLocaleDateString("pt-BR")}</div>
                    <div className="text-xs text-zinc-600">{new Date(mov.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-white">{mov.produtos?.nome ?? "—"}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      mov.tipo === "entrada"
                        ? "bg-indigo-500/15 text-indigo-400"
                        : "bg-zinc-700/50 text-zinc-400"
                    }`}>
                      {mov.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-white font-medium td-num">
                    {mov.quantidade} {mov.produtos?.unidade ?? ""}
                  </td>
                  <td className="py-3 px-4 text-zinc-500">{mov.observacao ?? "—"}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleExcluir(mov.id)}
                      disabled={excluindo === mov.id}
                      className="btn-danger"
                    >
                      {excluindo === mov.id ? "Excluindo..." : "Excluir"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {toast && <Toast mensagem={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

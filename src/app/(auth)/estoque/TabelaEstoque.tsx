"use client";

import { useState, useMemo } from "react";
import { Movimentacao, Produto } from "@/types";
import FormularioMovimentacao from "./FormularioMovimentacao";
import { excluirMovimentacao } from "./actions";
import Toast from "@/components/shared/Toast";
import DatePicker from "@/components/shared/DatePicker";

type Props = {
  movimentacoes: Movimentacao[];
  produtos: Produto[];
  notaObrigatoria: boolean;
};

function hojeStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function toLocalDateStr(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TabelaEstoque({ movimentacoes, produtos, notaObrigatoria }: Props) {
  const [abrirForm, setAbrirForm] = useState(false);
  const [tipoInicial, setTipoInicial] = useState<"entrada" | "saida">("entrada");
  const [dataSelecionada, setDataSelecionada] = useState(hojeStr());
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const movimentacoesFiltradas = useMemo(() =>
    movimentacoes.filter((mov) => toLocalDateStr(mov.created_at) === dataSelecionada),
    [movimentacoes, dataSelecionada]
  );

  const saldoPorProduto = useMemo(() =>
    movimentacoes.reduce<Record<string, number>>((acc, mov) => {
      acc[mov.produto_id] = (acc[mov.produto_id] ?? 0) + (mov.tipo === "entrada" ? mov.quantidade : -mov.quantidade);
      return acc;
    }, {}),
    [movimentacoes]
  );

  function handleNova(tipo: "entrada" | "saida") {
    setTipoInicial(tipo);
    setAbrirForm(true);
  }

  async function handleExcluir(id: string) {
    if (!confirm("Deseja excluir esta movimentacao?")) return;
    setExcluindo(id);
    const resultado = await excluirMovimentacao(id);
    setExcluindo(null);
    if (resultado?.erro) setToast(resultado.erro);
    else setToast("Movimentacao excluida.");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center gap-3">
        <DatePicker value={dataSelecionada} onChange={setDataSelecionada} />
        <div className="flex gap-3">
          <button onClick={() => handleNova("saida")} className="btn-secondary">
            Registrar saida
          </button>
          <button onClick={() => handleNova("entrada")} className="btn-primary">
            Registrar entrada
          </button>
        </div>
      </div>

      {abrirForm && (
        <FormularioMovimentacao
          produtos={produtos}
          saldoPorProduto={saldoPorProduto}
          tipoInicial={tipoInicial}
          notaObrigatoria={notaObrigatoria}
          onFechar={() => setAbrirForm(false)}
          onSucesso={() => setToast("Movimentacao registrada.")}
        />
      )}

      {movimentacoesFiltradas.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">Nenhuma movimentacao nesta data.</p>
          <button onClick={() => handleNova("entrada")} className="btn-primary">
            Registrar entrada
          </button>
        </div>
      ) : (
        <div className="glass-table overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="table-header">
                <th className="table-th">Data</th>
                {notaObrigatoria && <th className="table-th">OF</th>}
                <th className="table-th">Produto</th>
                <th className="table-th">Tipo</th>
                <th className="table-th-right">Quantidade</th>
                <th className="table-th">Observacao</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {movimentacoesFiltradas.map((mov, i) => (
                <tr
                  key={mov.id}
                  className={`border-b border-brand-border/40 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}
                >
                  <td className="py-3 px-4 text-brand-light whitespace-nowrap">
                    <div>{new Date(mov.created_at).toLocaleDateString("pt-BR")}</div>
                    <div className="text-xs text-brand-muted">{new Date(mov.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                  </td>
                  {notaObrigatoria && (
                    <td className="py-3 px-4 text-brand-light font-mono text-xs">{mov.nota_fiscal ?? "—"}</td>
                  )}
                  <td className="py-3 px-4 font-medium text-white">{mov.produtos?.nome ?? "—"}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      mov.tipo === "entrada"
                        ? "bg-brand-primary/15 text-brand-primary"
                        : "bg-brand-hover text-brand-light"
                    }`}>
                      {mov.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-white font-medium td-num">
                    {mov.quantidade} {mov.produtos?.unidade ?? ""}
                  </td>
                  <td className="py-3 px-4 text-brand-medium">{mov.observacao ?? "—"}</td>
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

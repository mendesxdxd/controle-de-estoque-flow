"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Movimentacao, Produto, OrdemFrete, NotaSaldo } from "@/types";
import FormularioEntrada from "./FormularioEntrada";
import FormularioSaida from "./FormularioSaida";
import { excluirMovimentacao } from "./actions";
import Toast from "@/components/shared/Toast";
import DatePicker from "@/components/shared/DatePicker";

type Props = {
  movimentacoes: Movimentacao[];
  produtos: Produto[];
  ofs: OrdemFrete[];
  saldos: NotaSaldo[];
  notaObrigatoria: boolean;
  role: "admin" | "operador" | "visualizador";
};

function hojeStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function toLocalDateStr(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TabelaEstoque({ movimentacoes, produtos, ofs, saldos, notaObrigatoria, role }: Props) {
  const router = useRouter();
  const podeEditar = role === "admin" || role === "operador";
  const [modo, setModo] = useState<"entrada" | "saida" | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState(hojeStr());
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const movimentacoesFiltradas = useMemo(() =>
    movimentacoes.filter((mov) => toLocalDateStr(mov.created_at) === dataSelecionada),
    [movimentacoes, dataSelecionada]
  );

  function handleNova(tipo: "entrada" | "saida") {
    setModo((atual) => (atual === tipo ? null : tipo));
  }

  function handleSucesso(msg: string) {
    setModo(null);
    setToast(msg);
    router.refresh();
  }

  async function handleExcluir(id: string) {
    if (!confirm("Deseja excluir esta movimentação?")) return;
    setExcluindo(id);
    const resultado = await excluirMovimentacao(id);
    setExcluindo(null);
    if (resultado?.erro) setToast(resultado.erro);
    else { setToast("Movimentação excluída."); router.refresh(); }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <DatePicker value={dataSelecionada} onChange={setDataSelecionada} />
        {podeEditar && (
          <div className="flex gap-3">
            <button onClick={() => handleNova("saida")} className="flex-1 sm:flex-none text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-150 active:scale-[0.98] text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20">
              Registrar saída
            </button>
            <button onClick={() => handleNova("entrada")} className="flex-1 sm:flex-none text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-150 active:scale-[0.98] text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm">
              Registrar entrada
            </button>
          </div>
        )}
      </div>

      {modo === "entrada" && (
        <FormularioEntrada
          produtos={produtos}
          notaObrigatoria={notaObrigatoria}
          onFechar={() => setModo(null)}
          onSucesso={() => handleSucesso("Entrada registrada.")}
        />
      )}
      {modo === "saida" && (
        <FormularioSaida
          ofs={ofs}
          saldos={saldos}
          onFechar={() => setModo(null)}
          onSucesso={() => handleSucesso("Saída registrada.")}
        />
      )}

      {movimentacoesFiltradas.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">Nenhuma movimentação nesta data.</p>
          {podeEditar && (
            <button onClick={() => handleNova("entrada")} className="text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-150 active:scale-[0.98] text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm">
              Registrar entrada
            </button>
          )}
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
                <th className="table-th">Observação</th>
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
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-red-500/15 text-red-400"
                    }`}>
                      {mov.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-white font-medium td-num">
                    {mov.quantidade} {mov.produtos?.unidade ?? ""}
                  </td>
                  <td className="py-3 px-4 text-brand-medium">{mov.observacao ?? "—"}</td>
                  <td className="py-3 px-4 text-right">
                    {mov.nota_id || mov.baixa_id ? (
                      <span className="text-xs text-brand-muted" title="Gerado por uma OF. Gerencie em Ordens de Frete.">via OF</span>
                    ) : podeEditar ? (
                      <button
                        onClick={() => handleExcluir(mov.id)}
                        disabled={excluindo === mov.id}
                        className="btn-danger"
                      >
                        {excluindo === mov.id ? "Excluindo..." : "Excluir"}
                      </button>
                    ) : null}
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

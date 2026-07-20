"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Movimentacao, Produto, OrdemFrete, NotaSaldo } from "@/types";
import PainelMovimentacao, { Modo } from "./PainelMovimentacao";
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
  const [modo, setModo] = useState<Modo>("entrada");
  const [dataSelecionada, setDataSelecionada] = useState(hojeStr());
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  const movimentacoesFiltradas = useMemo(() =>
    movimentacoes.filter((mov) => toLocalDateStr(mov.created_at) === dataSelecionada),
    [movimentacoes, dataSelecionada]
  );

  function irParaPainel(tipo: Modo) {
    setModo(tipo);
    const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    painelRef.current?.scrollIntoView({
      behavior: reduzirMovimento ? "auto" : "smooth",
      block: "start",
    });
  }

  function handleSucesso(msg: string) {
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
    <div className="flex flex-col gap-6">
      {podeEditar && (
        <div ref={painelRef} className="scroll-mt-4">
          <PainelMovimentacao
            modo={modo}
            onModoChange={setModo}
            produtos={produtos}
            ofs={ofs}
            saldos={saldos}
            notaObrigatoria={notaObrigatoria}
            onSucesso={handleSucesso}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <DatePicker value={dataSelecionada} onChange={setDataSelecionada} />
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
          {movimentacoesFiltradas.length}{" "}
          {movimentacoesFiltradas.length === 1 ? "movimentação" : "movimentações"}
        </span>
      </div>

      {movimentacoesFiltradas.length === 0 ? (
        <div className="empty-state">
          <span className="text-brand-muted">
            <Icon icon="tabler:clipboard-off" width={36} aria-hidden="true" />
          </span>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-semibold text-white">Nenhuma movimentação nesta data</p>
            <p className="empty-state-text">
              As entradas e saídas registradas nesta data aparecem aqui.
            </p>
          </div>
          {podeEditar && (
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => irParaPainel("entrada")} className="btn-primary">
                Registrar entrada
              </button>
              <button onClick={() => irParaPainel("saida")} className="btn-secondary">
                Registrar saída
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-table overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="table-header">
                <th className="table-th">Data</th>
                {notaObrigatoria && <th className="table-th">OF</th>}
                <th className="table-th">OF saída</th>
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
                  <td className="py-3 px-4 text-brand-light whitespace-nowrap td-num">
                    <div>{new Date(mov.created_at).toLocaleDateString("pt-BR")}</div>
                    <div className="text-xs text-brand-muted">{new Date(mov.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                  </td>
                  {notaObrigatoria && (
                    <td className="py-3 px-4 text-brand-light font-mono text-xs">{mov.nota_fiscal ?? "—"}</td>
                  )}
                  <td className="py-3 px-4 text-brand-light font-mono text-xs">{mov.of_saida ?? "—"}</td>
                  <td className="py-3 px-4 font-medium text-white">{mov.produtos?.nome ?? "—"}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold capitalize px-2.5 py-1 rounded-full ${
                      mov.tipo === "entrada"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-red-500/15 text-red-400"
                    }`}>
                      <Icon
                        icon={mov.tipo === "entrada" ? "tabler:arrow-down-circle" : "tabler:arrow-up-circle"}
                        width={12}
                        aria-hidden="true"
                      />
                      {mov.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-white font-medium td-num">
                    {mov.quantidade} {mov.produtos?.unidade ?? ""}
                  </td>
                  <td className="py-3 px-4 text-brand-medium">{mov.observacao ?? "—"}</td>
                  <td className="py-3 px-4 text-right">
                    {mov.nota_id || mov.baixa_id ? (
                      <span className="text-xs text-brand-muted" title="Gerado por uma OF. Para corrigir, use a tela de Conferência.">via OF</span>
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

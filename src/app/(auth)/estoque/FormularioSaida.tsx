"use client";

import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { OrdemFrete, NotaSaldo } from "@/types";
import { registrarSaidaNota } from "@/app/(auth)/ordens-frete/actions";

type Props = {
  ofs: OrdemFrete[];
  saldos: NotaSaldo[];
  onFechar: () => void;
  onSucesso?: () => void;
};

type NotaDisp = {
  notaId: string;
  produtoId: string;
  produtoNome: string;
  ofId: string;
  ofNumero: string;
  nfProduto: string | null;
  cxp: number | null;
  saldoCx: number;
};

function fmt(n: number) {
  return Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function paletesDe(caixas: number, cxp: number | null) {
  return cxp && cxp > 0 ? caixas / cxp : caixas;
}

export default function FormularioSaida({ ofs, saldos, onFechar, onSucesso }: Props) {
  const [produtoId, setProdutoId] = useState("");
  const [ofId, setOfId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const saldoPorNota = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of saldos) m.set(s.nota_id, Number(s.saldo));
    return m;
  }, [saldos]);

  // Notas de produto com saldo > 0 (achatadas com a OF de origem).
  const notasDisp = useMemo(() => {
    const arr: NotaDisp[] = [];
    for (const of of ofs) {
      for (const n of of.notas ?? []) {
        if (n.tipo !== "produto" || !n.produto_id) continue;
        const saldoCx = saldoPorNota.get(n.id) ?? 0;
        if (saldoCx <= 0) continue;
        arr.push({
          notaId: n.id,
          produtoId: n.produto_id,
          produtoNome: n.produtos?.nome ?? "Produto",
          ofId: of.id,
          ofNumero: of.numero,
          nfProduto: n.numero,
          cxp: n.produtos?.caixas_por_palete ?? null,
          saldoCx,
        });
      }
    }
    return arr;
  }, [ofs, saldoPorNota]);

  const produtos = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of notasDisp) m.set(n.produtoId, n.produtoNome);
    return [...m.entries()]
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [notasDisp]);

  const ofsDoProduto = notasDisp.filter((n) => n.produtoId === produtoId);
  const selecionada = ofsDoProduto.find((n) => n.ofId === ofId) ?? null;
  const cxpSel = selecionada?.cxp ?? null;
  const saldoDisponivel = paletesDe(selecionada?.saldoCx ?? 0, cxpSel); // em paletes

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setErro("");

    if (!selecionada) {
      setErro("Selecione o produto e a OF.");
      return;
    }
    const qtd = Number(quantidade);
    if (!qtd || qtd <= 0) {
      setErro("Informe uma quantidade maior que zero.");
      return;
    }
    if (qtd > saldoDisponivel + 1e-9) {
      setErro(`Saldo insuficiente. Disponivel: ${fmt(saldoDisponivel)} paletes.`);
      return;
    }

    const qtdCaixas = cxpSel && cxpSel > 0 ? qtd * cxpSel : qtd;

    setSalvando(true);
    try {
      const resultado = await registrarSaidaNota({
        nota_id: selecionada.notaId,
        quantidade: qtdCaixas,
        observacao: observacao.trim() || null,
      });
      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }
      onFechar();
      onSucesso?.();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <span className="text-red-400"><Icon icon="tabler:arrow-up-circle" width={16} /></span>
          Registrar saída (carregamento)
        </h2>
        <button onClick={onFechar} className="text-xs text-brand-medium hover:text-white transition-colors">Fechar</button>
      </div>

      {notasDisp.length === 0 ? (
        <p className="empty-state-text py-6">Nenhum produto com saldo disponível para saída.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-lg">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Produto</label>
            <select
              value={produtoId}
              onChange={(e) => { setProdutoId(e.target.value); setOfId(""); }}
              className="input-field"
            >
              <option value="">Selecione o produto...</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          {produtoId && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Ordem de Frete</label>
              <select value={ofId} onChange={(e) => setOfId(e.target.value)} className="input-field">
                <option value="">Selecione a OF...</option>
                {ofsDoProduto.map((n) => (
                  <option key={n.notaId} value={n.ofId}>
                    OF {n.ofNumero}
                    {n.nfProduto ? ` • NF ${n.nfProduto}` : ""} • {fmt(paletesDe(n.saldoCx, n.cxp))} paletes
                  </option>
                ))}
              </select>
            </div>
          )}

          {selecionada && (
            <>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Quantidade (paletes)</label>
                  <span className="text-xs text-brand-medium">
                    Disponível: <span className="text-emerald-400 font-semibold td-num">{fmt(saldoDisponivel)}</span> paletes
                  </span>
                </div>
                <input type="number" min="0" step="any" autoFocus value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className="input-field" placeholder="0" />
                {cxpSel && Number(quantidade) > 0 && (
                  <span className="text-[10px] text-brand-primary">= {fmt(Number(quantidade) * cxpSel)} caixas</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">
                  Observação <span className="text-brand-medium normal-case font-normal">(opcional)</span>
                </label>
                <input type="text" value={observacao} onChange={(e) => setObservacao(e.target.value)} className="input-field" placeholder="Ex: Carregamento caminhão placa ABC-1234" />
              </div>
            </>
          )}

          {erro && (
            <p className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{erro}</p>
          )}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={salvando || !selecionada} className="btn-primary">
              {salvando ? "Registrando..." : "Registrar saída"}
            </button>
            <button type="button" onClick={onFechar} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}

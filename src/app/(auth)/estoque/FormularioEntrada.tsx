"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { Produto } from "@/types";
import { criarEntradaOF } from "@/app/(auth)/ordens-frete/actions";

type ItemForm = {
  produto_id: string;
  numero: string;
  nfPalete: string;
  quantidade: string;
  unidade: "cx" | "palete";
};

type Props = {
  produtos: Produto[];
  notaObrigatoria: boolean;
  onFechar: () => void;
  onSucesso?: () => void;
};

function novoItem(): ItemForm {
  return { produto_id: "", numero: "", nfPalete: "", quantidade: "1", unidade: "cx" };
}

export default function FormularioEntrada({ produtos, notaObrigatoria, onFechar, onSucesso }: Props) {
  const [numeroOF, setNumeroOF] = useState("");
  const [transportadora, setTransportadora] = useState<"MA TRANSP" | "OUTRAS" | "">("");
  const [itens, setItens] = useState<ItemForm[]>([novoItem()]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function atualizarItem(index: number, campo: keyof ItemForm, valor: string) {
    setItens((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      if (campo === "produto_id") {
        const prod = produtos.find((p) => p.id === valor);
        return { ...item, produto_id: valor, unidade: prod?.caixas_por_palete ? "palete" : "cx" };
      }
      return { ...item, [campo]: valor };
    }));
  }

  function calcularQtdCaixas(item: ItemForm): number {
    const produto = produtos.find((p) => p.id === item.produto_id);
    const qtd = parseInt(item.quantidade) || 0;
    if (item.unidade === "palete" && produto?.caixas_por_palete) {
      return qtd * produto.caixas_por_palete;
    }
    return qtd;
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setErro("");

    if (!numeroOF.trim()) {
      setErro("Numero da OF e obrigatorio.");
      return;
    }

    for (const item of itens) {
      if (!item.produto_id) {
        setErro("Selecione o produto em todas as linhas.");
        return;
      }
      if (!parseInt(item.quantidade) || parseInt(item.quantidade) <= 0) {
        setErro("A quantidade de cada produto deve ser maior que zero.");
        return;
      }
    }

    type NotaPayload = {
      tipo: "produto";
      numero: string | null;
      nf_palete: string | null;
      produto_id: string | null;
      quantidade_inicial: number;
      observacao: string | null;
    };

    const notas: NotaPayload[] = itens.map((item) => ({
      tipo: "produto",
      numero: item.numero.trim() || null,
      nf_palete: item.nfPalete.trim() || null,
      produto_id: item.produto_id,
      quantidade_inicial: calcularQtdCaixas(item),
      observacao: item.unidade === "palete" ? `${parseInt(item.quantidade)} palete(s)` : null,
    }));

    setSalvando(true);
    try {
      const resultado = await criarEntradaOF({
        numero: numeroOF.trim(),
        observacao: null,
        transportadora: transportadora || null,
        notas,
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
          <span className="text-emerald-400"><Icon icon="tabler:arrow-down-circle" width={16} /></span>
          Registrar entrada (OF)
        </h2>
        <button onClick={onFechar} className="text-xs text-brand-medium hover:text-white transition-colors">Fechar</button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Numero da OF</label>
            <input type="text" value={numeroOF} onChange={(e) => setNumeroOF(e.target.value)} className="input-field" placeholder="Ex: 6100181424" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">
              Transportadora <span className="text-brand-medium normal-case font-normal">(opcional)</span>
            </label>
            <div className="flex bg-brand-card border border-brand-border rounded-xl p-1 w-fit gap-1">
              {(["MA TRANSP", "OUTRAS"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTransportadora(transportadora === t ? "" : t)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                    transportadora === t ? "bg-brand-hover border border-brand-border-hl text-white" : "text-brand-medium hover:text-white hover:bg-brand-hover"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Produtos */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Produtos / Notas</label>
          {itens.map((item, index) => {
            const produto = produtos.find((p) => p.id === item.produto_id);
            const caixasPorPalete = produto?.caixas_por_palete ?? null;
            const qtdNum = parseInt(item.quantidade) || 0;
            const qtdEmCaixas = item.unidade === "palete" && caixasPorPalete ? qtdNum * caixasPorPalete : qtdNum;

            return (
              <div key={index} className="flex flex-wrap items-end gap-3 p-3 rounded-xl" style={{ background: "#0f0f18", border: "1px solid #252540" }}>
                <div className="flex flex-col gap-1 min-w-[180px] flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">Produto</span>
                  <select value={item.produto_id} onChange={(e) => atualizarItem(index, "produto_id", e.target.value)} className="input-field">
                    <option value="">Selecione...</option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome} ({p.unidade})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">NF produto</span>
                  <input type="text" value={item.numero} onChange={(e) => atualizarItem(index, "numero", e.target.value)} className="input-field" style={{ width: 120 }} placeholder="Ex: 12345" />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">NF palete</span>
                  <input type="text" value={item.nfPalete} onChange={(e) => atualizarItem(index, "nfPalete", e.target.value)} className="input-field" style={{ width: 120 }} placeholder="Ex: 6789" />
                </div>

                {caixasPorPalete && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">Unidade</span>
                    <div className="flex bg-brand-card border border-brand-border rounded-xl p-1 gap-1">
                      {(["cx", "palete"] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => atualizarItem(index, "unidade", u)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            item.unidade === u ? "bg-brand-hover border border-brand-border-hl text-white" : "text-brand-medium hover:text-white"
                          }`}
                        >
                          {u === "cx" ? "Caixa" : "Palete"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
                    Qtd {item.unidade === "palete" ? "(paletes)" : "(caixas)"}
                  </span>
                  <input type="number" min="1" value={item.quantidade} onChange={(e) => atualizarItem(index, "quantidade", e.target.value)} className="input-field" style={{ width: 110 }} />
                  {caixasPorPalete && item.unidade === "palete" && qtdNum > 0 && (
                    <span className="text-[10px] text-brand-primary">= {qtdEmCaixas} cx</span>
                  )}
                </div>

                {itens.length > 1 && (
                  <button type="button" onClick={() => setItens((prev) => prev.filter((_, i) => i !== index))} className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all" title="Remover">
                    <Icon icon="tabler:trash" width={16} />
                  </button>
                )}
              </div>
            );
          })}
          <button type="button" onClick={() => setItens((prev) => [...prev, novoItem()])} className="text-xs text-brand-light hover:text-white transition-colors text-left">
            + Adicionar produto
          </button>
        </div>

        {erro && (
          <p className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{erro}</p>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? "Salvando..." : "Registrar entrada"}
          </button>
          <button type="button" onClick={onFechar} className="btn-secondary">Cancelar</button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Produto } from "@/types";
import { registrarNota } from "./actions";

type ItemForm = {
  produto_id: string;
  quantidade: string;
  unidade: "cx" | "palete";
};

type Props = {
  produtos: Produto[];
  saldoPorProduto: Record<string, number>;
  tipoInicial: "entrada" | "saida";
  notaObrigatoria: boolean;
  onFechar: () => void;
  onSucesso?: () => void;
};

function novoItem(): ItemForm {
  return { produto_id: "", quantidade: "1", unidade: "cx" };
}

export default function FormularioMovimentacao({ produtos, saldoPorProduto, tipoInicial, notaObrigatoria, onFechar, onSucesso }: Props) {
  const [tipo, setTipo] = useState<"entrada" | "saida">(tipoInicial);
  const [notaFiscal, setNotaFiscal] = useState("");
  const [itens, setItens] = useState<ItemForm[]>([novoItem()]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function atualizarItem(index: number, campo: keyof ItemForm, valor: string) {
    setItens((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      if (campo === "produto_id") return { ...item, produto_id: valor, unidade: "cx" };
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

    if (notaObrigatoria && !notaFiscal.trim()) {
      setErro("Numero da nota e obrigatorio.");
      return;
    }

    for (const item of itens) {
      if (!item.produto_id) {
        setErro("Selecione o produto em todos os itens.");
        return;
      }
      if (!parseInt(item.quantidade) || parseInt(item.quantidade) <= 0) {
        setErro("A quantidade deve ser maior que zero.");
        return;
      }
    }

    const itensMapeados = itens.map((item) => {
      const produto = produtos.find((p) => p.id === item.produto_id);
      const qtdCaixas = calcularQtdCaixas(item);
      const qtd = parseInt(item.quantidade);
      const obs = item.unidade === "palete" && produto?.caixas_por_palete
        ? `${qtd} palete${qtd > 1 ? "s" : ""}`
        : null;
      return { produto_id: item.produto_id, quantidade: qtdCaixas, observacao: obs };
    });

    setSalvando(true);
    try {
      const resultado = await registrarNota({
        nota_fiscal: notaFiscal.trim(),
        tipo,
        itens: itensMapeados,
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
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">
          Registrar movimentacao
        </h2>
        <button onClick={onFechar} className="text-xs text-brand-medium hover:text-white transition-colors">
          Fechar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-lg">
        <div className="flex bg-brand-hover border border-brand-border rounded-xl p-1 w-fit gap-1">
          {(["entrada", "saida"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`px-5 py-2 text-sm font-semibold capitalize rounded-lg transition-all duration-150 ${
                tipo === t ? "bg-brand-hover text-white" : "text-brand-medium hover:text-white hover:bg-brand-hover"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">
            Numero da OF {!notaObrigatoria && <span className="text-brand-medium normal-case font-normal">(opcional)</span>}
          </label>
          <input
            type="text"
            value={notaFiscal}
            onChange={(e) => setNotaFiscal(e.target.value)}
            className="input-field"
            placeholder="Ex: 6100181424"
          />
        </div>

        {itens.map((item, index) => {
          const produto = produtos.find((p) => p.id === item.produto_id);
          const caixasPorPalete = produto?.caixas_por_palete ?? null;
          const qtdNum = parseInt(item.quantidade) || 0;
          const qtdEmCaixas = item.unidade === "palete" && caixasPorPalete ? qtdNum * caixasPorPalete : qtdNum;
          const saldoAtual = item.produto_id ? (saldoPorProduto[item.produto_id] ?? 0) : null;

          return (
            <div key={index} className="flex flex-col gap-3 border-t border-brand-border pt-4">
              {itens.length > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-medium">Produto {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => setItens((prev) => prev.filter((_, i) => i !== index))}
                    className="text-xs text-brand-muted hover:text-red-400 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Produto</label>
                <select
                  value={item.produto_id}
                  onChange={(e) => atualizarItem(index, "produto_id", e.target.value)}
                  className="input-field"
                >
                  <option value="">Selecione um produto</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome} ({p.unidade})</option>
                  ))}
                </select>
              </div>

              {caixasPorPalete && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Registrar por</label>
                  <div className="flex bg-brand-hover border border-brand-border rounded-xl p-1 w-fit gap-1">
                    {(["cx", "palete"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => atualizarItem(index, "unidade", u)}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-150 ${
                          item.unidade === u ? "bg-brand-hover text-white" : "text-brand-medium hover:text-white hover:bg-brand-hover"
                        }`}
                      >
                        {u === "cx" ? "Caixa" : "Palete"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">
                    Quantidade {item.unidade === "palete" ? "(paletes)" : "(caixas)"}
                  </label>
                  {tipo === "saida" && saldoAtual !== null && (
                    <span className="text-xs text-brand-medium">
                      Disponivel: <span className={saldoAtual === 0 ? "text-red-400" : "text-brand-light"}>{saldoAtual} cx</span>
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="1"
                  value={item.quantidade}
                  onChange={(e) => atualizarItem(index, "quantidade", e.target.value)}
                  className="input-field"
                />
                {item.unidade === "palete" && caixasPorPalete && qtdNum > 0 && (
                  <p className="text-xs text-brand-primary mt-1">
                    {qtdNum} palete{qtdNum > 1 ? "s" : ""} × {caixasPorPalete} cx = <span className="font-semibold">{qtdEmCaixas} cx</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setItens((prev) => [...prev, novoItem()])}
          className="text-xs text-brand-light hover:text-white transition-colors text-left pt-1"
        >
          + Adicionar produto
        </button>

        {erro && (
          <p className="text-xs text-red-400 bg-red-950/50 border border-red-800 px-3 py-2 rounded-lg">{erro}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button type="submit" disabled={salvando} className="btn-primary w-full sm:w-auto">
            {salvando ? "Salvando..." : "Registrar"}
          </button>
          <button type="button" onClick={onFechar} className="btn-secondary w-full sm:w-auto">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

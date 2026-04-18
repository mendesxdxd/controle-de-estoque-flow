"use client";

import { useState } from "react";
import { Produto } from "@/types";
import { registrarMovimentacao } from "./actions";

type Props = {
  produtos: Produto[];
  tipoInicial: "entrada" | "saida";
  onFechar: () => void;
  onSucesso?: () => void;
};

export default function FormularioMovimentacao({ produtos, tipoInicial, onFechar, onSucesso }: Props) {
  const [tipo, setTipo] = useState<"entrada" | "saida">(tipoInicial);
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!produtoId) {
      setErro("Selecione um produto.");
      return;
    }

    const qtd = parseInt(quantidade);
    if (!qtd || qtd <= 0) {
      setErro("A quantidade deve ser maior que zero.");
      return;
    }

    setSalvando(true);
    const resultado = await registrarMovimentacao({
      produto_id: produtoId,
      tipo,
      quantidade: qtd,
      observacao: observacao.trim() || null,
    });

    if (resultado?.erro) {
      setErro(resultado.erro);
      setSalvando(false);
      return;
    }

    onFechar();
    onSucesso?.();
  }

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">
          Registrar movimentacao
        </h2>
        <button
          onClick={onFechar}
          className="text-xs text-zinc-500 hover:text-white transition-colors"
        >
          Fechar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
        <div className="flex bg-white/5 border border-white/[0.08] rounded-xl p-1 w-fit gap-1">
          {(["entrada", "saida"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`px-5 py-2 text-sm font-semibold capitalize rounded-lg transition-all duration-150 ${
                tipo === t
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Produto</label>
          <select
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value)}
            className="input-field-strong"
          >
            <option value="">Selecione um produto</option>
            {produtos.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.nome} ({prod.unidade})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Quantidade</label>
          <input
            type="number"
            min="1"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            className="input-field-strong"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Observacao <span className="text-zinc-400 normal-case font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className="input-field"
            placeholder="Ex: compra NF 1234"
          />
        </div>

        {erro && (
          <p className="text-xs text-red-400 bg-red-950/50 border border-red-800 px-3 py-2">{erro}</p>
        )}

        <div className="flex gap-3 mt-2">
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? "Salvando..." : "Registrar"}
          </button>
          <button type="button" onClick={onFechar} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

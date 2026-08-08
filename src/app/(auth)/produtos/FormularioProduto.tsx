"use client";

import { useState } from "react";
import { Produto, Categoria } from "@/types";
import { salvarProduto } from "./actions";

type Props = {
  produto: Produto | null;
  categorias: Categoria[];
  onFechar: () => void;
  onSucesso?: () => void;
};

export default function FormularioProduto({ produto, categorias, onFechar, onSucesso }: Props) {
  const [nome, setNome] = useState(produto?.nome ?? "");
  const [codigo, setCodigo] = useState(produto?.codigo ?? "");
  const [categoriaId, setCategoriaId] = useState(produto?.categoria_id ?? "");
  const [unidade, setUnidade] = useState(produto?.unidade ?? "un");
  const [estoqueMinimo, setEstoqueMinimo] = useState(produto?.estoque_minimo?.toString() ?? "0");
  const [caixasPorPalete, setCaixasPorPalete] = useState(produto?.caixas_por_palete?.toString() ?? "");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");

    if (!nome.trim()) {
      setErro("O nome é obrigatório.");
      return;
    }

    setSalvando(true);
    const resultado = await salvarProduto({
      id: produto?.id,
      nome: nome.trim(),
      codigo: codigo.trim() || null,
      categoria_id: categoriaId || null,
      unidade,
      estoque_minimo: parseInt(estoqueMinimo) || 0,
      caixas_por_palete: caixasPorPalete.trim() ? parseInt(caixasPorPalete) : null,
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
          {produto ? "Editar produto" : "Novo produto"}
        </h2>
        <button
          onClick={onFechar}
          className="text-xs text-brand-medium hover:text-white transition-colors"
        >
          Fechar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <div className="flex flex-col gap-1 col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="input-field"
            placeholder="Nome do produto"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">
            Código <span className="text-brand-light normal-case font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="input-field"
            placeholder="SKU ou código interno"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Categoria</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="input-field"
          >
            <option value="">Sem categoria</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nome}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Unidade</label>
          <select
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            className="input-field"
          >
            <option value="un">Unidade (un)</option>
            <option value="kg">Quilograma (kg)</option>
            <option value="g">Grama (g)</option>
            <option value="l">Litro (l)</option>
            <option value="ml">Mililitro (ml)</option>
            <option value="cx">Caixa (cx)</option>
            <option value="pct">Pacote (pct)</option>
            <option value="m">Metro (m)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Estoque mínimo</label>
          <input
            type="number"
            min="0"
            value={estoqueMinimo}
            onChange={(e) => setEstoqueMinimo(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">
            Caixas por palete <span className="text-brand-light normal-case font-normal">(opcional)</span>
          </label>
          <input
            type="number"
            min="1"
            value={caixasPorPalete}
            onChange={(e) => setCaixasPorPalete(e.target.value)}
            className="input-field"
            placeholder="Ex: 180"
          />
        </div>

        {erro && (
          <p className="text-xs text-red-400 bg-red-950/50 border border-red-800 px-3 py-2 col-span-2">{erro}</p>
        )}

        <div className="flex gap-3 col-span-2 mt-2">
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? "Salvando..." : "Salvar"}
          </button>
          <button type="button" onClick={onFechar} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Categoria } from "@/types";
import { salvarCategoria } from "./actions";

type Props = {
  categoria: Categoria | null;
  onFechar: () => void;
};

export default function FormularioCategoria({ categoria, onFechar }: Props) {
  const [nome, setNome] = useState(categoria?.nome ?? "");
  const [descricao, setDescricao] = useState(categoria?.descricao ?? "");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!nome.trim()) {
      setErro("O nome e obrigatorio.");
      return;
    }

    setSalvando(true);
    const resultado = await salvarCategoria({
      id: categoria?.id,
      nome: nome.trim(),
      descricao: descricao.trim() || null,
    });

    if (resultado?.erro) {
      setErro(resultado.erro);
      setSalvando(false);
      return;
    }

    onFechar();
  }

  return (
    <div className="border border-zinc-200 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black">
          {categoria ? "Editar categoria" : "Nova categoria"}
        </h2>
        <button
          onClick={onFechar}
          className="text-xs text-zinc-400 hover:text-black transition-colors"
        >
          Fechar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-black">Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="input-field-strong"
            placeholder="Nome da categoria"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-black">
            Descricao <span className="text-zinc-400 normal-case font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="input-field"
            placeholder="Descricao da categoria"
          />
        </div>

        {erro && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{erro}</p>
        )}

        <div className="flex gap-3 mt-2">
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

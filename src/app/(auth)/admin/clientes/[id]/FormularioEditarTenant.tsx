"use client";

import { useState } from "react";
import { atualizarTenant } from "../../actions";

interface Props {
  id: string;
  nomeInicial: string;
  capacidadeInicial: number | null;
}

export default function FormularioEditarTenant({ id, nomeInicial, capacidadeInicial }: Props) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(nomeInicial);
  const [capacidade, setCapacidade] = useState(capacidadeInicial?.toString() ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function handleCancelar() {
    setNome(nomeInicial);
    setCapacidade(capacidadeInicial?.toString() ?? "");
    setErro("");
    setEditando(false);
  }

  async function handleSalvar() {
    if (!nome.trim()) {
      setErro("Nome e obrigatorio.");
      return;
    }
    setSalvando(true);
    setErro("");
    const cap = capacidade.trim() ? parseInt(capacidade, 10) : null;
    const resultado = await atualizarTenant(id, nome.trim(), cap);
    setSalvando(false);
    if (resultado?.erro) {
      setErro(resultado.erro);
      return;
    }
    setEditando(false);
  }

  if (!editando) {
    return (
      <button onClick={() => setEditando(true)} className="btn-secondary text-xs">
        Editar
      </button>
    );
  }

  return (
    <div className="glass-panel p-4 flex flex-col gap-3 w-full max-w-sm">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Nome</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="input-field"
          placeholder="Nome da empresa"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Capacidade</label>
        <input
          type="number"
          value={capacidade}
          onChange={(e) => setCapacidade(e.target.value)}
          className="input-field"
          placeholder="Ex: 1700"
          min={0}
        />
      </div>
      {erro && (
        <p className="text-xs text-red-400 bg-red-950/50 border border-red-800 px-3 py-2 rounded-lg">{erro}</p>
      )}
      <div className="flex gap-2">
        <button onClick={handleSalvar} disabled={salvando} className="btn-primary text-xs">
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        <button onClick={handleCancelar} disabled={salvando} className="btn-secondary text-xs">
          Cancelar
        </button>
      </div>
    </div>
  );
}
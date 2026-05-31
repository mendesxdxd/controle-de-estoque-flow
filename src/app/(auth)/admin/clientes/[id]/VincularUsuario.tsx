"use client";

import { useState } from "react";
import { vincularUsuarioExistente } from "../../actions";

type Usuario = { id: string; email: string };

type Props = {
  tenantId: string;
  usuariosSemTenant: Usuario[];
};

export default function VincularUsuario({ tenantId, usuariosSemTenant }: Props) {
  const [aberto, setAberto] = useState(false);
  const [userId, setUserId] = useState("");
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  if (usuariosSemTenant.length === 0) return null;

  function handleAbrir() {
    setUserId("");
    setNome("");
    setErro("");
    setAberto(true);
  }

  async function handleSalvar() {
    if (!userId) {
      setErro("Selecione um usuário.");
      return;
    }
    if (!nome.trim()) {
      setErro("Nome é obrigatório.");
      return;
    }
    setSalvando(true);
    const resultado = await vincularUsuarioExistente(userId, tenantId, nome.trim(), false);
    setSalvando(false);
    if (resultado?.erro) {
      setErro(resultado.erro);
      return;
    }
    setAberto(false);
  }

  if (!aberto) {
    return (
      <button onClick={handleAbrir} className="btn-secondary text-xs">
        Adicionar existente
      </button>
    );
  }

  return (
    <div className="glass-panel p-4 flex flex-col gap-3 w-full max-w-sm">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Usuário</label>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="input-field"
        >
          <option value="">Selecione...</option>
          {usuariosSemTenant.map((u) => (
            <option key={u.id} value={u.id}>{u.email}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Nome</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="input-field"
          placeholder="Nome do usuário"
        />
      </div>

      {erro && (
        <p className="text-xs text-red-400 bg-red-950/50 border border-red-800 px-3 py-2 rounded-lg">{erro}</p>
      )}

      <div className="flex gap-2">
        <button onClick={handleSalvar} disabled={salvando} className="btn-primary text-xs">
          {salvando ? "Salvando..." : "Vincular"}
        </button>
        <button onClick={() => setAberto(false)} disabled={salvando} className="btn-secondary text-xs">
          Cancelar
        </button>
      </div>
    </div>
  );
}

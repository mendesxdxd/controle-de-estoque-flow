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
  const [podeFechamento, setPodeFechamento] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  if (usuariosSemTenant.length === 0) return null;

  function handleAbrir() {
    setUserId("");
    setNome("");
    setPodeFechamento(false);
    setErro("");
    setAberto(true);
  }

  async function handleSalvar() {
    if (!userId) {
      setErro("Selecione um usuario.");
      return;
    }
    if (!nome.trim()) {
      setErro("Nome e obrigatorio.");
      return;
    }
    setSalvando(true);
    const resultado = await vincularUsuarioExistente(userId, tenantId, nome.trim(), podeFechamento);
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
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Usuario</label>
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
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Nome</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="input-field"
          placeholder="Nome do usuario"
        />
      </div>

      <div className="flex items-center gap-3 py-1">
        <input
          type="checkbox"
          id="vincular-fechamento"
          checked={podeFechamento}
          onChange={(e) => setPodeFechamento(e.target.checked)}
          className="w-4 h-4 accent-indigo-500"
        />
        <label htmlFor="vincular-fechamento" className="text-sm text-zinc-300">
          Liberar fechamento do dia
        </label>
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

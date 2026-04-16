"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PerfilPage() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso(false);

    if (novaSenha.length < 6) {
      setErro("A nova senha deve ter no minimo 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas nao coincidem.");
      return;
    }

    setSalvando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: novaSenha });

    if (error) {
      setErro("Erro ao atualizar a senha. Tente novamente.");
      setSalvando(false);
      return;
    }

    setSucesso(true);
    setNovaSenha("");
    setConfirmarSenha("");
    setSalvando(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="page-title">Perfil</h1>
        <p className="page-subtitle">Gerencie suas informacoes de acesso</p>
      </div>

      <div className="border border-zinc-200 bg-white shadow-sm p-6 max-w-md">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black mb-6">
          Alterar senha
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-black">
              Nova senha
            </label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="input-field-strong"
              placeholder="Minimo 6 caracteres"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-black">
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="input-field-strong"
              placeholder="Repita a nova senha"
            />
          </div>

          {erro && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{erro}</p>
          )}

          {sucesso && (
            <p className="text-xs text-black bg-zinc-100 border border-zinc-300 px-3 py-2 font-semibold">
              Senha alterada com sucesso.
            </p>
          )}

          <button type="submit" disabled={salvando} className="btn-primary mt-2">
            {salvando ? "Salvando..." : "Alterar senha"}
          </button>
        </form>
      </div>
    </div>
  );
}

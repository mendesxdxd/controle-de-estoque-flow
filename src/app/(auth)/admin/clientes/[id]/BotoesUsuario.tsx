"use client";

import { useState } from "react";

type Props = {
  userId: string;
  tenantId: string;
  emailUsuario: string;
  podeFechamento: boolean;
  notaObrigatoria: boolean;
  atualizarPermissao: (userId: string, tenantId: string, campo: "pode_fechamento" | "nota_obrigatoria", valor: boolean) => Promise<{ erro: string } | undefined>;
  desvincularUsuario: (userId: string, tenantId: string) => Promise<{ erro: string } | undefined>;
  excluirUsuario: (userId: string, emailUsuario: string, tenantId: string, senhaAdmin: string) => Promise<{ erro: string } | undefined>;
};

export default function BotoesUsuario({ userId, tenantId, emailUsuario, podeFechamento, notaObrigatoria, atualizarPermissao, desvincularUsuario, excluirUsuario }: Props) {
  const [atualizandoFechamento, setAtualizandoFechamento] = useState(false);
  const [atualizandoNota, setAtualizandoNota] = useState(false);
  const [desvinculando, setDesvinculando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [emailConfirm, setEmailConfirm] = useState("");
  const [senhaAdmin, setSenhaAdmin] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");

  async function handleToggleFechamento() {
    setAtualizandoFechamento(true);
    await atualizarPermissao(userId, tenantId, "pode_fechamento", !podeFechamento);
    setAtualizandoFechamento(false);
  }

  async function handleToggleNota() {
    setAtualizandoNota(true);
    await atualizarPermissao(userId, tenantId, "nota_obrigatoria", !notaObrigatoria);
    setAtualizandoNota(false);
  }

  async function handleDesvincular() {
    if (!confirm("Deseja remover este usuario da empresa? O acesso sera revogado mas a conta sera mantida.")) return;
    setDesvinculando(true);
    await desvincularUsuario(userId, tenantId);
    setDesvinculando(false);
  }

  function abrirModal() {
    setEmailConfirm("");
    setSenhaAdmin("");
    setErro("");
    setModalAberto(true);
  }

  async function handleExcluir() {
    setErro("");
    if (!emailConfirm.trim() || !senhaAdmin.trim()) {
      setErro("Preencha todos os campos.");
      return;
    }
    setExcluindo(true);
    const resultado = await excluirUsuario(userId, emailConfirm.trim(), tenantId, senhaAdmin);
    setExcluindo(false);
    if (resultado?.erro) {
      setErro(resultado.erro);
      return;
    }
    setModalAberto(false);
  }

  return (
    <>
      <div className="flex gap-4 justify-end items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Nota</span>
          <button
            onClick={handleToggleNota}
            disabled={atualizandoNota}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
              notaObrigatoria ? "bg-indigo-500" : "bg-zinc-700"
            } ${atualizandoNota ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
              notaObrigatoria ? "translate-x-4" : "translate-x-0.5"
            }`} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Fechamento</span>
          <button
            onClick={handleToggleFechamento}
            disabled={atualizandoFechamento}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
              podeFechamento ? "bg-indigo-500" : "bg-zinc-700"
            } ${atualizandoFechamento ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
              podeFechamento ? "translate-x-4" : "translate-x-0.5"
            }`} />
          </button>
        </div>
        <button onClick={handleDesvincular} disabled={desvinculando} className="btn-secondary text-xs">
          {desvinculando ? "..." : "Remover"}
        </button>
        <button onClick={abrirModal} className="btn-danger text-xs">
          Excluir
        </button>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 flex flex-col gap-4 w-full max-w-sm mx-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Excluir usuario</h3>
              <p className="text-xs text-zinc-400 mt-1">Esta acao e permanente e nao pode ser desfeita.</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Email do usuario</label>
              <input
                type="email"
                value={emailConfirm}
                onChange={(e) => setEmailConfirm(e.target.value)}
                className="input-field"
                placeholder={emailUsuario}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Sua senha de admin</label>
              <input
                type="password"
                value={senhaAdmin}
                onChange={(e) => setSenhaAdmin(e.target.value)}
                className="input-field"
                placeholder="Digite sua senha"
                onKeyDown={(e) => e.key === "Enter" && handleExcluir()}
              />
            </div>

            {erro && (
              <p className="text-xs text-red-400 bg-red-950/50 border border-red-800 px-3 py-2 rounded-lg">{erro}</p>
            )}

            <div className="flex gap-2">
              <button onClick={handleExcluir} disabled={excluindo} className="btn-danger text-xs flex-1">
                {excluindo ? "Excluindo..." : "Confirmar exclusao"}
              </button>
              <button onClick={() => setModalAberto(false)} disabled={excluindo} className="btn-secondary text-xs">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { excluirTenant } from "./actions";

export default function BotaoExcluirTenant({ id, nome }: { id: string; nome: string }) {
  const [modalAberto, setModalAberto] = useState(false);
  const [senhaAdmin, setSenhaAdmin] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");

  function abrirModal() {
    setSenhaAdmin("");
    setErro("");
    setModalAberto(true);
  }

  async function handleExcluir() {
    setErro("");
    if (!senhaAdmin.trim()) {
      setErro("Digite sua senha para confirmar.");
      return;
    }
    setExcluindo(true);
    const resultado = await excluirTenant(id, senhaAdmin);
    setExcluindo(false);
    if (resultado?.erro) {
      setErro(resultado.erro);
      return;
    }
    setModalAberto(false);
  }

  const modal = modalAberto && (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9999, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl"
        style={{ background: "#0d0d15", border: "1px solid #2a1f1f" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.12)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-white">Excluir empresa</h3>
          </div>
          <p className="text-xs text-brand-medium ml-8">
            Voce esta prestes a excluir <span className="text-white font-medium">{nome}</span>. Todos os usuarios, produtos, estoque e movimentacoes serao apagados permanentemente.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-brand-light tracking-wide">Sua senha de admin</label>
          <input
            type="password"
            value={senhaAdmin}
            onChange={(e) => setSenhaAdmin(e.target.value)}
            className="input-field"
            placeholder="Digite sua senha para confirmar"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleExcluir()}
          />
        </div>

        {erro && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/50 px-3 py-2 rounded-xl">{erro}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setModalAberto(false)}
            disabled={excluindo}
            className="btn-secondary text-xs flex-1"
          >
            Cancelar
          </button>
          <button
            onClick={handleExcluir}
            disabled={excluindo}
            className="btn-danger text-xs flex-1"
          >
            {excluindo ? "Excluindo..." : "Confirmar exclusao"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button onClick={abrirModal} className="btn-danger text-xs">
        Excluir
      </button>
      {typeof document !== "undefined" && createPortal(modal, document.body)}
    </>
  );
}

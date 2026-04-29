"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

type Role = "admin" | "operador" | "visualizador";

type Props = {
  userId: string;
  tenantId: string;
  emailUsuario: string;
  podeFechamento: boolean;
  notaObrigatoria: boolean;
  roleInicial: Role;
  atualizarPermissao: (userId: string, tenantId: string, campo: "pode_fechamento" | "nota_obrigatoria", valor: boolean) => Promise<{ erro?: string; sucesso?: boolean } | undefined>;
  atualizarRole: (userId: string, tenantId: string, role: Role) => Promise<{ erro?: string; sucesso?: boolean } | undefined>;
  desvincularUsuario: (userId: string, tenantId: string) => Promise<{ erro?: string; sucesso?: boolean } | undefined>;
  excluirUsuario: (userId: string, emailUsuario: string, tenantId: string, senhaAdmin: string) => Promise<{ erro?: string; sucesso?: boolean } | undefined>;
};

const roleCores: Record<Role, string> = {
  admin:        "#8B83FF",
  operador:     "#34d399",
  visualizador: "#9ca3af",
};

export default function BotoesUsuario({ userId, tenantId, emailUsuario, podeFechamento, notaObrigatoria, roleInicial, atualizarPermissao, atualizarRole, desvincularUsuario, excluirUsuario }: Props) {
  const [fechamento, setFechamento] = useState(podeFechamento);
  const [nota, setNota] = useState(notaObrigatoria);
  const [role, setRole] = useState<Role>(roleInicial);
  const [rolePendente, setRolePendente] = useState<Role>(roleInicial);
  const [atualizandoRole, setAtualizandoRole] = useState(false);
  const [atualizandoFechamento, setAtualizandoFechamento] = useState(false);
  const [atualizandoNota, setAtualizandoNota] = useState(false);
  const [desvinculando, setDesvinculando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [senhaAdmin, setSenhaAdmin] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");

  async function handleToggleFechamento() {
    const novo = !fechamento;
    setFechamento(novo);
    setAtualizandoFechamento(true);
    const resultado = await atualizarPermissao(userId, tenantId, "pode_fechamento", novo);
    setAtualizandoFechamento(false);
    if (resultado?.erro) setFechamento(!novo);
  }

  async function handleToggleNota() {
    const novo = !nota;
    setNota(novo);
    setAtualizandoNota(true);
    const resultado = await atualizarPermissao(userId, tenantId, "nota_obrigatoria", novo);
    setAtualizandoNota(false);
    if (resultado?.erro) setNota(!novo);
  }

  async function handleDesvincular() {
    if (!confirm("Deseja remover este usuario da empresa? O acesso sera revogado mas a conta sera mantida.")) return;
    setDesvinculando(true);
    await desvincularUsuario(userId, tenantId);
    setDesvinculando(false);
  }

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
    const resultado = await excluirUsuario(userId, emailUsuario, tenantId, senhaAdmin);
    setExcluindo(false);
    if (resultado?.erro) {
      setErro(resultado.erro);
      return;
    }
    setModalAberto(false);
  }

  async function handleSalvarRole() {
    setAtualizandoRole(true);
    const resultado = await atualizarRole(userId, tenantId, rolePendente);
    setAtualizandoRole(false);
    if (resultado?.erro) {
      setRolePendente(role);
    } else {
      setRole(rolePendente);
    }
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
            <h3 className="text-sm font-bold text-white">Excluir usuario</h3>
          </div>
          <p className="text-xs text-brand-medium ml-8">
            Voce esta prestes a excluir <span className="text-white font-medium">{emailUsuario}</span>. Esta acao e permanente.
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
      <div className="flex gap-4 justify-end items-center flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-medium">Perfil</span>
          <select
            value={rolePendente}
            onChange={(e) => setRolePendente(e.target.value as Role)}
            disabled={atualizandoRole}
            className="text-xs font-semibold rounded-lg px-2 py-1 border border-brand-border focus:outline-none focus:border-brand-primary/50 transition-colors"
            style={{ background: "#0d0d15", color: roleCores[rolePendente] }}
          >
            <option value="admin">Admin</option>
            <option value="operador">Operador</option>
            <option value="visualizador">Visualizador</option>
          </select>
          {rolePendente !== role && (
            <button
              onClick={handleSalvarRole}
              disabled={atualizandoRole}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-150 disabled:opacity-50"
              style={{ background: "rgba(108,99,255,0.15)", color: "#8B83FF" }}
            >
              {atualizandoRole ? "..." : "Salvar"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-medium">Nota</span>
          <button
            onClick={handleToggleNota}
            disabled={atualizandoNota}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
              nota ? "bg-brand-primary" : "bg-brand-hover"
            } ${atualizandoNota ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
              nota ? "translate-x-4" : "translate-x-0.5"
            }`} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-medium">Fechamento</span>
          <button
            onClick={handleToggleFechamento}
            disabled={atualizandoFechamento}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
              fechamento ? "bg-brand-primary" : "bg-brand-hover"
            } ${atualizandoFechamento ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
              fechamento ? "translate-x-4" : "translate-x-0.5"
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

      {typeof document !== "undefined" && createPortal(modal, document.body)}
    </>
  );
}

"use client";

import { useState } from "react";
import { concluirOnboarding } from "./actions";

const etapas = ["Bem-vindo", "Configuracoes", "Pronto"];

export default function OnboardingPage() {
  const [etapa, setEtapa] = useState(0);
  const [capacidade, setCapacidade] = useState("");
  const [notaObrigatoria, setNotaObrigatoria] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleFinalizar() {
    setErro("");
    setCarregando(true);
    const cap = capacidade.trim() ? parseInt(capacidade.replace(/\D/g, ""), 10) : null;
    const resultado = await concluirOnboarding(cap && !isNaN(cap) ? cap : null, notaObrigatoria);
    if (resultado?.erro) {
      setErro(resultado.erro);
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-52px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10 justify-center">
          {etapas.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                  style={{
                    background: i <= etapa ? "linear-gradient(135deg, #8B83FF, #6C63FF)" : "#1a1a2e",
                    color: i <= etapa ? "#fff" : "#4b5563",
                    border: i === etapa ? "2px solid #8B83FF" : "2px solid transparent",
                    boxShadow: i === etapa ? "0 0 12px rgba(108,99,255,0.4)" : "none",
                  }}
                >
                  {i < etapa ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className="text-[10px]" style={{ color: i === etapa ? "#8B83FF" : "#374151" }}>{label}</span>
              </div>
              {i < etapas.length - 1 && (
                <div className="w-12 h-px mb-4" style={{ background: i < etapa ? "#8B83FF" : "#1a1a2e" }} />
              )}
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
          <div
            className="rounded-2xl p-8 shadow-2xl"
            style={{ background: "#0d0d15", border: "1px solid #1a1a2e" }}
          >

            {/* Etapa 0 - Boas vindas */}
            {etapa === 0 && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 mb-2">
                    <img src="/favicon.svg" alt="FlowStock" className="w-9 h-9" />
                    <span className="text-xl font-bold text-white tracking-tight">FlowStock</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Bem-vindo ao FlowStock</h2>
                  <p className="text-sm text-brand-medium leading-relaxed">
                    Vamos configurar sua conta em menos de 2 minutos. Responda algumas perguntas rapidas sobre sua operacao.
                  </p>
                </div>

                <div
                  className="rounded-xl p-4 flex flex-col gap-3"
                  style={{ background: "rgba(108,99,255,0.06)", border: "1px solid rgba(108,99,255,0.15)" }}
                >
                  {[
                    "Gerencie seu estoque em tempo real",
                    "Controle entradas e saidas com facilidade",
                    "Relatorios e metricas do seu negocio",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(108,99,255,0.25)" }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#8B83FF" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span className="text-xs text-brand-light">{item}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setEtapa(1)}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #8B83FF, #6C63FF)", boxShadow: "0 4px 14px rgba(108,99,255,0.25)" }}
                >
                  Comecar configuracao
                </button>
              </div>
            )}

            {/* Etapa 1 - Configuracoes */}
            {etapa === 1 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">Configuracoes iniciais</h2>
                  <p className="text-sm text-brand-medium">Essas configuracoes podem ser alteradas depois no painel.</p>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-brand-light tracking-wide">
                      Capacidade do armazem
                      <span className="ml-1.5 font-normal" style={{ color: "#4b5563" }}>(opcional)</span>
                    </label>
                    <input
                      type="number"
                      value={capacidade}
                      onChange={(e) => setCapacidade(e.target.value)}
                      min={0}
                      placeholder="Ex: 10000"
                      className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/20 transition-all duration-200"
                    />
                    <p className="text-xs" style={{ color: "#4b5563" }}>
                      Numero maximo de unidades no estoque. Deixe vazio se nao tiver limite.
                    </p>
                  </div>

                  <div
                    className="flex items-center justify-between rounded-xl px-4 py-3.5"
                    style={{ background: "#111120", border: "1px solid #1a1a2e" }}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">Nota obrigatoria</p>
                      <p className="text-xs mt-0.5" style={{ color: "#4b5563" }}>
                        Exigir nota fiscal em todas as movimentacoes
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotaObrigatoria((v) => !v)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${
                        notaObrigatoria ? "bg-brand-primary" : "bg-brand-hover"
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                        notaObrigatoria ? "translate-x-4" : "translate-x-0.5"
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEtapa(0)}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={{ background: "#1a1a2e", color: "#6b7280" }}
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setEtapa(2)}
                    className="flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #8B83FF, #6C63FF)", boxShadow: "0 4px 14px rgba(108,99,255,0.25)" }}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* Etapa 2 - Confirmacao */}
            {etapa === 2 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">Tudo pronto!</h2>
                  <p className="text-sm text-brand-medium">Revise suas configuracoes antes de comecar.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <div
                    className="rounded-xl px-4 py-3.5 flex items-center justify-between"
                    style={{ background: "#111120", border: "1px solid #1a1a2e" }}
                  >
                    <span className="text-sm text-brand-light">Capacidade do armazem</span>
                    <span className="text-sm font-semibold text-white">
                      {capacidade.trim() && !isNaN(parseInt(capacidade))
                        ? parseInt(capacidade).toLocaleString("pt-BR") + " un."
                        : "Sem limite"}
                    </span>
                  </div>
                  <div
                    className="rounded-xl px-4 py-3.5 flex items-center justify-between"
                    style={{ background: "#111120", border: "1px solid #1a1a2e" }}
                  >
                    <span className="text-sm text-brand-light">Nota obrigatoria</span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: notaObrigatoria ? "rgba(108,99,255,0.15)" : "rgba(156,163,175,0.10)",
                        color: notaObrigatoria ? "#8B83FF" : "#6b7280",
                      }}
                    >
                      {notaObrigatoria ? "Sim" : "Nao"}
                    </span>
                  </div>
                </div>

                {erro && (
                  <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-2.5">{erro}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setEtapa(1)}
                    disabled={carregando}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                    style={{ background: "#1a1a2e", color: "#6b7280" }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={handleFinalizar}
                    disabled={carregando}
                    className="flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #8B83FF, #6C63FF)", boxShadow: "0 4px 14px rgba(108,99,255,0.25)" }}
                  >
                    {carregando ? "Salvando..." : "Ir para o dashboard"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { createClient } from "@/lib/supabase/client";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/redefinir-senha`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setErro("Nao foi possivel enviar o email. Verifique o endereco e tente novamente.");
      setCarregando(false);
      return;
    }

    setEnviado(true);
    setCarregando(false);
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">

      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-700/25 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-700/20 rounded-full blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="relative w-full max-w-sm mx-4">

        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent rounded-t-2xl" />

        <div className="bg-brand-card backdrop-blur-2xl border border-brand-border rounded-2xl p-10 shadow-2xl shadow-black/60">

          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <img src="/favicon.svg" alt="FlowStock" className="w-8 h-8" />
              <h1 className="text-xl font-bold text-white tracking-tight">FlowStock</h1>
            </div>
            <p className="text-sm font-semibold text-white mb-1">Recuperar senha</p>
            <p className="text-sm text-brand-medium">
              {enviado
                ? "Verifique sua caixa de entrada."
                : "Informe seu email para receber o link de recuperacao."}
            </p>
          </div>

          {enviado ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-3 py-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(108,99,255,0.12)", border: "1px solid rgba(108,99,255,0.2)" }}
                >
                  <Icon icon="tabler:mail" width={28} style={{ color: "#8B83FF" }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white mb-1">Email enviado</p>
                  <p className="text-xs text-brand-medium">
                    Enviamos um link para <span className="text-white font-medium">{email}</span>.
                    O link expira em 1 hora.
                  </p>
                </div>
              </div>

              <Link
                href="/login"
                className="w-full py-3 rounded-xl text-sm font-semibold text-white text-center transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #8B83FF, #6C63FF)",
                  boxShadow: "0 4px 14px rgba(108,99,255,0.25)",
                }}
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-brand-light tracking-wide">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-primary/50 focus:bg-brand-card focus:ring-1 focus:ring-brand-primary/20 transition-all duration-200"
                    placeholder="seu@email.com"
                  />
                  <Icon icon="tabler:mail" width={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                </div>
              </div>

              {erro && (
                <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-2.5">{erro}</p>
              )}

              <button
                type="submit"
                disabled={carregando}
                className="mt-1 w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #8B83FF, #6C63FF)",
                  boxShadow: "0 4px 14px rgba(108,99,255,0.25)",
                }}
              >
                {carregando ? "Enviando..." : "Enviar link de recuperacao"}
              </button>

              <Link
                href="/login"
                className="text-xs text-brand-medium hover:text-white text-center transition-colors duration-150"
              >
                Voltar ao login
              </Link>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
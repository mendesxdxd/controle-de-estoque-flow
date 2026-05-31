"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      setErro("Email ou senha incorretos.");
      setCarregando(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">

      {/* Orbs de fundo */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-700/25 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-700/20 rounded-full blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-900/20 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />



      {/* Card */}
      <div className="relative w-full max-w-sm mx-4">

        {/* Borda brilhante no topo do card */}
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent rounded-t-2xl" />

        <div className="bg-brand-card backdrop-blur-2xl border border-brand-border rounded-2xl p-10 shadow-2xl shadow-black/60">

          {/* Logo */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <img src="/favicon.svg" alt="FlowStock" className="w-8 h-8" />
              <h1 className="text-xl font-bold text-white tracking-tight">FlowStock</h1>
            </div>
            <p className="text-sm text-brand-medium">Acesse sua conta para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-brand-light tracking-wide">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-primary/50 focus:bg-brand-card focus:ring-1 focus:ring-brand-primary/20 transition-all duration-200"
                  placeholder="seu@email.com"
                />
                <Icon icon="tabler:mail" width={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted" />
              </div>
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-brand-light tracking-wide">Senha</label>
                <Link href="/esqueci-senha" className="text-xs text-brand-medium hover:text-white transition-colors duration-150">
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-primary/50 focus:bg-brand-card focus:ring-1 focus:ring-brand-primary/20 transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-light transition-colors"
                >
                  <Icon icon={mostrarSenha ? "tabler:eye-off" : "tabler:eye"} width={16} />
                </button>
              </div>
            </div>

            {erro && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-2.5">{erro}</p>
            )}

            {/* Botao */}
            <button
              type="submit"
              disabled={carregando}
              className="mt-1 w-full py-3 rounded-xl bg-gradient-to-r from-brand-primary to-brand-primary hover:from-brand-primary hover:to-brand-primary text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-brand-primary/20 active:scale-[0.98]"
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>

          </form>
        </div>

        {/* Links legais */}
        <div className="mt-4 flex justify-center gap-4">
          <Link href="/termos" className="text-xs transition-colors duration-150" style={{ color: "#4b5563" }}>
            Termos de uso
          </Link>
          <span className="text-xs" style={{ color: "#1f2937" }}>·</span>
          <Link href="/privacidade" className="text-xs transition-colors duration-150" style={{ color: "#4b5563" }}>
            Privacidade
          </Link>
        </div>

      </div>
    </div>
  );
}

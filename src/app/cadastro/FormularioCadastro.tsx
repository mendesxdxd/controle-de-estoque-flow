"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cadastrarEmpresa } from "./actions";

export default function FormularioCadastro({ token }: { token: string }) {
  const router = useRouter();
  const [empresa, setEmpresa] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");

    if (senha.length < 6) {
      setErro("A senha deve ter no minimo 6 caracteres.");
      return;
    }

    setCarregando(true);

    const resultado = await cadastrarEmpresa({ empresa, nome, email, senha, token });

    if (resultado?.erro) {
      setErro(resultado.erro);
      setCarregando(false);
      return;
    }

    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (loginError) {
      setErro("Conta criada, mas nao foi possivel entrar automaticamente. Faca login manualmente.");
      setCarregando(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative px-6 py-12">

      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-700/25 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-700/20 rounded-full blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="relative w-full max-w-sm">

        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent rounded-t-2xl" />

        <div className="bg-brand-card backdrop-blur-2xl border border-brand-border rounded-2xl p-10 shadow-2xl shadow-black/60">

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <img src="/favicon.svg" alt="FlowStock" className="w-8 h-8" />
              <h1 className="text-xl font-bold text-white tracking-tight">FlowStock</h1>
            </div>
            <p className="text-sm font-semibold text-white mb-1">Criar conta</p>
            <p className="text-sm text-brand-medium">Voce foi convidado a usar o FlowStock.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-brand-light tracking-wide">Nome da empresa</label>
              <input
                type="text"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                required
                autoFocus
                className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/20 transition-all duration-200"
                placeholder="Ex: Transportadora Silva"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-brand-light tracking-wide">Seu nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/20 transition-all duration-200"
                placeholder="Ex: Joao Silva"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-brand-light tracking-wide">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/20 transition-all duration-200"
                  placeholder="seu@email.com"
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-brand-light tracking-wide">Senha</label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/20 transition-all duration-200"
                  placeholder="Minimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-light transition-colors"
                >
                  {mostrarSenha ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {erro && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-2.5">{erro}</p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="mt-1 w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #8B83FF, #6C63FF)",
                boxShadow: "0 4px 14px rgba(108,99,255,0.25)",
              }}
            >
              {carregando ? "Criando conta..." : "Criar conta"}
            </button>

            <p className="text-xs text-center" style={{ color: "#4b5563" }}>
              Ao criar uma conta voce concorda com os{" "}
              <Link href="/termos" className="hover:text-white transition-colors" style={{ color: "#6b7280" }}>termos de uso</Link>
              {" "}e a{" "}
              <Link href="/privacidade" className="hover:text-white transition-colors" style={{ color: "#6b7280" }}>politica de privacidade</Link>.
            </p>

          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "#4b5563" }}>
          Ja tem uma conta?{" "}
          <Link href="/login" className="font-semibold hover:text-white transition-colors" style={{ color: "#6b7280" }}>
            Entrar
          </Link>
        </p>

      </div>
    </div>
  );
}

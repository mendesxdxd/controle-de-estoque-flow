"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { createClient } from "@/lib/supabase/client";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");

    if (senha.length < 6) {
      setErro("A senha deve ter no minimo 6 caracteres.");
      return;
    }

    if (senha !== confirmar) {
      setErro("As senhas nao coincidem.");
      return;
    }

    setCarregando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });

    if (error) {
      setErro("Nao foi possivel redefinir a senha. O link pode ter expirado. Solicite um novo.");
      setCarregando(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
            <p className="text-sm font-semibold text-white mb-1">Nova senha</p>
            <p className="text-sm text-brand-medium">Escolha uma nova senha para sua conta.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Nova senha */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-brand-light tracking-wide">Nova senha</label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  autoFocus
                  minLength={6}
                  className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-primary/50 focus:bg-brand-card focus:ring-1 focus:ring-brand-primary/20 transition-all duration-200"
                  placeholder="Minimo 6 caracteres"
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

            {/* Confirmar senha */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-brand-light tracking-wide">Confirmar senha</label>
              <div className="relative">
                <input
                  type={mostrarConfirmar ? "text" : "password"}
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  required
                  className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-primary/50 focus:bg-brand-card focus:ring-1 focus:ring-brand-primary/20 transition-all duration-200"
                  placeholder="Repita a nova senha"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-light transition-colors"
                >
                  <Icon icon={mostrarConfirmar ? "tabler:eye-off" : "tabler:eye"} width={16} />
                </button>
              </div>
            </div>

            {/* Barra de forca da senha */}
            {senha.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((n) => {
                    const forca = senha.length < 6 ? 1 : senha.length < 8 ? 2 : /[A-Z]/.test(senha) && /[0-9]/.test(senha) ? 4 : 3;
                    return (
                      <div
                        key={n}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: n <= forca
                            ? forca === 1 ? "#ef4444"
                              : forca === 2 ? "#f97316"
                              : forca === 3 ? "#eab308"
                              : "#22c55e"
                            : "#252540"
                        }}
                      />
                    );
                  })}
                </div>
                <p className="text-xs" style={{ color: "#6b7280" }}>
                  {senha.length < 6 ? "Muito curta" : senha.length < 8 ? "Fraca" : /[A-Z]/.test(senha) && /[0-9]/.test(senha) ? "Forte" : "Media"}
                </p>
              </div>
            )}

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
              {carregando ? "Salvando..." : "Redefinir senha"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

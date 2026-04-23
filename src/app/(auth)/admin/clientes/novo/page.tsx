"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { criarTenant } from "../../actions";

export default function NovoClientePage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [capacidade, setCapacidade] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");

    if (!nome.trim()) {
      setErro("O nome e obrigatorio.");
      return;
    }

    setSalvando(true);
    const resultado = await criarTenant(
      nome.trim(),
      capacidade ? parseInt(capacidade) : null
    );
    setSalvando(false);

    if (resultado?.erro) {
      setErro(resultado.erro);
      return;
    }

    router.push("/admin");
  }

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-brand-medium hover:text-white transition-colors text-sm">
          Admin
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-sm text-white">Nova empresa</span>
      </div>

      <div>
        <h1 className="page-title">Nova empresa</h1>
        <p className="page-subtitle">Cadastrar uma nova empresa no sistema</p>
      </div>

      <div className="glass-panel p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Nome da empresa</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="input-field"
              placeholder="Ex: Empresa X"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Capacidade</label>
            <input
              type="number"
              value={capacidade}
              onChange={(e) => setCapacidade(e.target.value)}
              className="input-field"
              placeholder="Ex: 1700 (opcional)"
              min={0}
            />
          </div>

          {erro && (
            <p className="text-xs text-red-400 bg-red-950/50 border border-red-800 px-3 py-2 rounded-lg">{erro}</p>
          )}

          <div className="flex gap-3 mt-2">
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? "Criando..." : "Criar empresa"}
            </button>
            <Link href="/admin" className="btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

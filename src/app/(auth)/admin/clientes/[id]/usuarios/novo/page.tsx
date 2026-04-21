"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { criarUsuarioTenant } from "../../../../actions";

export default function NovoUsuarioPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [podeFechamento, setPodeFechamento] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");

    if (!nome.trim()) {
      setErro("Nome e obrigatorio.");
      return;
    }

    if (!email.trim() || !senha.trim()) {
      setErro("Email e senha sao obrigatorios.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter no minimo 6 caracteres.");
      return;
    }

    setSalvando(true);
    const resultado = await criarUsuarioTenant(email.trim(), senha, tenantId, podeFechamento, nome.trim());
    setSalvando(false);

    if (resultado?.erro) {
      setErro(resultado.erro);
      return;
    }

    router.push(`/admin/clientes/${tenantId}`);
  }

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin" className="text-zinc-500 hover:text-white transition-colors text-sm">Admin</Link>
        <span className="text-zinc-700">/</span>
        <Link href={`/admin/clientes/${tenantId}`} className="text-zinc-500 hover:text-white transition-colors text-sm">Empresa</Link>
        <span className="text-zinc-700">/</span>
        <span className="text-sm text-white">Novo usuario</span>
      </div>

      <div>
        <h1 className="page-title">Novo usuario</h1>
        <p className="page-subtitle">Criar e vincular usuario a empresa</p>
      </div>

      <div className="glass-panel p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="input-field"
              placeholder="Nome do usuario"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="input-field"
              placeholder="Minimo 6 caracteres"
            />
          </div>

          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              id="podeFechamento"
              checked={podeFechamento}
              onChange={(e) => setPodeFechamento(e.target.checked)}
              className="w-4 h-4 accent-indigo-500"
            />
            <label htmlFor="podeFechamento" className="text-sm text-zinc-300">
              Liberar fechamento do dia e graficos
            </label>
          </div>

          {erro && (
            <p className="text-xs text-red-400 bg-red-950/50 border border-red-800 px-3 py-2 rounded-lg">{erro}</p>
          )}

          <div className="flex gap-3 mt-2">
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? "Criando..." : "Criar usuario"}
            </button>
            <Link href={`/admin/clientes/${tenantId}`} className="btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { criarUsuario, excluirUsuario } from "./actions";

type Usuario = {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
};

type Props = {
  usuarios: Usuario[];
};

export default function TabelaUsuarios({ usuarios }: Props) {
  const [abrirForm, setAbrirForm] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!email.trim() || !senha.trim()) {
      setErro("Email e senha sao obrigatorios.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter no minimo 6 caracteres.");
      return;
    }

    setSalvando(true);
    const resultado = await criarUsuario(email.trim(), senha);

    if (resultado?.erro) {
      setErro(resultado.erro);
      setSalvando(false);
      return;
    }

    setEmail("");
    setSenha("");
    setSalvando(false);
    setAbrirForm(false);
  }

  async function handleExcluir(id: string, emailUsuario?: string) {
    if (!confirm(`Deseja excluir o usuario ${emailUsuario ?? id}?`)) return;
    setExcluindo(id);
    const resultado = await excluirUsuario(id);
    setExcluindo(null);
    if (resultado?.erro) {
      setErro(resultado.erro);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={() => setAbrirForm(!abrirForm)} className="btn-primary">
          Novo usuario
        </button>
      </div>

      {abrirForm && (
        <div className="border border-zinc-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-black">Novo usuario</h2>
            <button
              onClick={() => setAbrirForm(false)}
              className="text-xs text-zinc-400 hover:text-black transition-colors"
            >
              Fechar
            </button>
          </div>

          <form onSubmit={handleCriar} className="flex flex-col gap-4 max-w-md">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-black">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field-strong"
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-black">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="input-field-strong"
                placeholder="Minimo 6 caracteres"
              />
            </div>

            {erro && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{erro}</p>
            )}

            <div className="flex gap-3 mt-2">
              <button type="submit" disabled={salvando} className="btn-primary">
                {salvando ? "Criando..." : "Criar usuario"}
              </button>
              <button type="button" onClick={() => setAbrirForm(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {usuarios.length === 0 ? (
        <div className="border border-zinc-200 bg-white py-16 text-center">
          <p className="text-sm text-zinc-400">Nenhum usuario cadastrado.</p>
        </div>
      ) : (
        <div className="border border-zinc-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[500px]">
            <thead>
              <tr className="table-header">
                <th className="table-th">Email</th>
                <th className="table-th">Criado em</th>
                <th className="table-th">Ultimo acesso</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, i) => (
                <tr
                  key={u.id}
                  className={`border-b border-zinc-100 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}
                >
                  <td className="py-3 px-4 font-medium text-black">{u.email ?? "—"}</td>
                  <td className="py-3 px-4 text-zinc-500">
                    {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-3 px-4 text-zinc-500">
                    {u.last_sign_in_at
                      ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR")
                      : "Nunca"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleExcluir(u.id, u.email)}
                      disabled={excluindo === u.id}
                      className="btn-danger"
                    >
                      {excluindo === u.id ? "Excluindo..." : "Excluir"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

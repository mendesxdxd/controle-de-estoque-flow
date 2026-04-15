"use client";

import { useState } from "react";
import { Categoria } from "@/types";
import FormularioCategoria from "./FormularioCategoria";
import { excluirCategoria } from "./actions";

type Props = {
  categorias: Categoria[];
};

export default function TabelaCategorias({ categorias }: Props) {
  const [abrirForm, setAbrirForm] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  function handleEditar(categoria: Categoria) {
    setEditando(categoria);
    setAbrirForm(true);
  }

  function handleNova() {
    setEditando(null);
    setAbrirForm(true);
  }

  function handleFechar() {
    setAbrirForm(false);
    setEditando(null);
  }

  async function handleExcluir(id: string) {
    if (!confirm("Deseja excluir esta categoria?")) return;
    setExcluindo(id);
    await excluirCategoria(id);
    setExcluindo(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={handleNova} className="btn-primary">
          Nova categoria
        </button>
      </div>

      {abrirForm && (
        <FormularioCategoria categoria={editando} onFechar={handleFechar} />
      )}

      {categorias.length === 0 ? (
        <div className="border border-zinc-200 bg-white py-16 text-center">
          <p className="text-sm text-zinc-400">Nenhuma categoria cadastrada.</p>
        </div>
      ) : (
        <div className="border border-zinc-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[500px]">
            <thead>
              <tr className="table-header">
                <th className="table-th">Nome</th>
                <th className="table-th">Descricao</th>
                <th className="table-th">Criado em</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {categorias.map((cat, i) => (
                <tr
                  key={cat.id}
                  className={`border-b border-zinc-100 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}
                >
                  <td className="py-3 px-4 font-medium text-black">{cat.nome}</td>
                  <td className="py-3 px-4 text-zinc-500">{cat.descricao ?? "—"}</td>
                  <td className="py-3 px-4 text-zinc-500">
                    {new Date(cat.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-4 justify-end">
                      <button onClick={() => handleEditar(cat)} className="btn-action">
                        Editar
                      </button>
                      <button
                        onClick={() => handleExcluir(cat.id)}
                        disabled={excluindo === cat.id}
                        className="btn-danger"
                      >
                        {excluindo === cat.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
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

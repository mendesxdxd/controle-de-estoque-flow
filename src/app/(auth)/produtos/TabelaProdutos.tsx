"use client";

import { useState } from "react";
import { Produto, Categoria } from "@/types";
import FormularioProduto from "./FormularioProduto";
import { excluirProduto } from "./actions";

type Props = {
  produtos: Produto[];
  categorias: Categoria[];
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function TabelaProdutos({ produtos, categorias }: Props) {
  const [abrirForm, setAbrirForm] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  function handleEditar(produto: Produto) {
    setEditando(produto);
    setAbrirForm(true);
  }

  function handleNovo() {
    setEditando(null);
    setAbrirForm(true);
  }

  function handleFechar() {
    setAbrirForm(false);
    setEditando(null);
  }

  async function handleExcluir(id: string) {
    if (!confirm("Deseja excluir este produto?")) return;
    setExcluindo(id);
    await excluirProduto(id);
    setExcluindo(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={handleNovo} className="btn-primary">
          Novo produto
        </button>
      </div>

      {abrirForm && (
        <FormularioProduto produto={editando} categorias={categorias} onFechar={handleFechar} />
      )}

      {produtos.length === 0 ? (
        <div className="border border-zinc-200 bg-white py-16 text-center">
          <p className="text-sm text-zinc-400">Nenhum produto cadastrado.</p>
        </div>
      ) : (
        <div className="border border-zinc-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="table-header">
                <th className="table-th">Codigo</th>
                <th className="table-th">Nome</th>
                <th className="table-th">Categoria</th>
                <th className="table-th">Unidade</th>
                <th className="table-th-right">Custo</th>
                <th className="table-th-right">Venda</th>
                <th className="table-th-right">Est. Min.</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {produtos.map((prod, i) => (
                <tr
                  key={prod.id}
                  className={`border-b border-zinc-100 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}
                >
                  <td className="py-3 px-4 text-zinc-500">{prod.codigo ?? "—"}</td>
                  <td className="py-3 px-4 font-medium text-black">{prod.nome}</td>
                  <td className="py-3 px-4 text-zinc-500">{prod.categorias?.nome ?? "—"}</td>
                  <td className="py-3 px-4 text-zinc-500">{prod.unidade}</td>
                  <td className="py-3 px-4 text-right text-zinc-500">{formatarMoeda(prod.preco_custo)}</td>
                  <td className="py-3 px-4 text-right text-zinc-500">{formatarMoeda(prod.preco_venda)}</td>
                  <td className="py-3 px-4 text-right text-zinc-500">{prod.estoque_minimo}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-4 justify-end">
                      <button onClick={() => handleEditar(prod)} className="btn-action">
                        Editar
                      </button>
                      <button
                        onClick={() => handleExcluir(prod.id)}
                        disabled={excluindo === prod.id}
                        className="btn-danger"
                      >
                        {excluindo === prod.id ? "Excluindo..." : "Excluir"}
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

"use client";

import { useState } from "react";
import { Produto, Categoria } from "@/types";
import FormularioProduto from "./FormularioProduto";
import { excluirProduto } from "./actions";
import Toast from "@/components/shared/Toast";

type Props = {
  produtos: Produto[];
  categorias: Categoria[];
};

export default function TabelaProdutos({ produtos, categorias }: Props) {
  const [abrirForm, setAbrirForm] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
    const resultado = await excluirProduto(id);
    setExcluindo(null);
    if (resultado?.erro) {
      setToast(resultado.erro);
    } else {
      setToast("Produto excluído.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={handleNovo} className="btn-primary">
          Novo produto
        </button>
      </div>

      {abrirForm && (
        <FormularioProduto
          produto={editando}
          categorias={categorias}
          onFechar={handleFechar}
          onSucesso={() => setToast(editando ? "Produto atualizado." : "Produto criado.")}
        />
      )}

      {produtos.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">Nenhum produto cadastrado.</p>
          <button onClick={handleNovo} className="btn-primary">
            Criar primeiro produto
          </button>
        </div>
      ) : (
        <div className="glass-table overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="table-header">
                <th className="table-th">Código</th>
                <th className="table-th">Nome</th>
                <th className="table-th">Categoria</th>
                <th className="table-th">Unidade</th>
                <th className="table-th-right">Est. Min.</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {produtos.map((prod, i) => (
                <tr
                  key={prod.id}
                  className={`border-b border-brand-border/40 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}
                >
                  <td className="py-3 px-4 text-brand-medium">{prod.codigo ?? "—"}</td>
                  <td className="py-3 px-4 font-medium text-white">{prod.nome}</td>
                  <td className="py-3 px-4 text-brand-medium">{prod.categorias?.nome ?? "—"}</td>
                  <td className="py-3 px-4 text-brand-medium">{prod.unidade}</td>
                  <td className="py-3 px-4 text-right text-brand-light td-num">{prod.estoque_minimo}</td>
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
      {toast && <Toast mensagem={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { EstoqueAtualRow, Movimentacao } from "@/types";
import TabelaEstoqueAtual from "./TabelaEstoqueAtual";
import TabelaEstoqueBaixo from "./TabelaEstoqueBaixo";
import FiltroMovimentacoes from "./FiltroMovimentacoes";

export type { EstoqueAtualRow };

export default async function RelatoriosPage() {
  const supabase = await createClient();

  const [{ data: estoqueAtual }, { data: movimentacoes }] = await Promise.all([
    supabase.from("estoque_atual").select("*").order("nome"),
    supabase
      .from("movimentacoes")
      .select("*, produtos(id, nome, unidade)")
      .order("created_at", { ascending: false }),
  ]);

  const estoqueBaixo = (estoqueAtual as EstoqueAtualRow[])?.filter(
    (p) => p.estoque_atual <= p.estoque_minimo
  ) ?? [];

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="text-2xl font-bold text-black tracking-tight">Relatorios</h1>
        <p className="text-sm text-neutral-500 mt-1">Visao detalhada do estoque e movimentacoes</p>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-black pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-black">Estoque atual</h2>
          <span className="text-xs text-neutral-500">{estoqueAtual?.length ?? 0} produtos</span>
        </div>
        <TabelaEstoqueAtual rows={(estoqueAtual as EstoqueAtualRow[]) ?? []} />
      </section>

      {estoqueBaixo.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-black pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-black">Estoque baixo</h2>
            <span className="text-xs font-semibold text-red-600">{estoqueBaixo.length} produto{estoqueBaixo.length !== 1 ? "s" : ""} abaixo do minimo</span>
          </div>
          <TabelaEstoqueBaixo rows={estoqueBaixo} />
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-black pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-black">Movimentacoes</h2>
          <span className="text-xs text-neutral-500">{movimentacoes?.length ?? 0} registros</span>
        </div>
        <FiltroMovimentacoes movimentacoes={(movimentacoes as Movimentacao[]) ?? []} />
      </section>
    </div>
  );
}

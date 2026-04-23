import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { EstoqueAtualRow, Movimentacao } from "@/types";
import TabelaEstoqueAtual from "./TabelaEstoqueAtual";
import TabelaEstoqueBaixo from "./TabelaEstoqueBaixo";
import FiltroMovimentacoes from "./FiltroMovimentacoes";

export default async function RelatoriosPage() {
  const supabase = await createClient();
  const tenant = await getTenant();

  const [{ data: estoqueAtual }, { data: movimentacoes }] = await Promise.all([
    supabase.from("estoque_atual").select("*").order("nome"),
    supabase
      .from("movimentacoes")
      .select("*, produtos(id, nome, unidade, caixas_por_palete)")
      .order("created_at", { ascending: false }),
  ]);

  const podeFechamento = tenant?.pode_fechamento ?? false;
  const capacidadeArmazem = tenant?.capacidade_armazem ?? 0;

  const estoqueBaixo = (estoqueAtual as EstoqueAtualRow[])?.filter(
    (p) => p.estoque_atual <= p.estoque_minimo
  ) ?? [];

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="page-title">Relatorios</h1>
        <p className="page-subtitle">Visao detalhada do estoque e movimentacoes</p>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-700 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Estoque atual</h2>
          <span className="text-xs text-brand-medium">{estoqueAtual?.length ?? 0} produtos</span>
        </div>
        <TabelaEstoqueAtual
          rows={(estoqueAtual as EstoqueAtualRow[]) ?? []}
          movimentacoes={(movimentacoes as Movimentacao[]) ?? []}
          podeFechamento={podeFechamento}
          capacidadeArmazem={capacidadeArmazem}
          tenantNome={tenant?.nome ?? ""}
        />
      </section>

      {estoqueBaixo.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-700 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Estoque baixo</h2>
            <span className="text-xs font-semibold text-red-400">{estoqueBaixo.length} produto{estoqueBaixo.length !== 1 ? "s" : ""} abaixo do minimo</span>
          </div>
          <TabelaEstoqueBaixo rows={estoqueBaixo} />
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-700 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Movimentacoes</h2>
          <span className="text-xs text-brand-medium">{movimentacoes?.length ?? 0} registros</span>
        </div>
        <FiltroMovimentacoes movimentacoes={(movimentacoes as Movimentacao[]) ?? []} />
      </section>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { EstoqueAtualRow, Movimentacao } from "@/types";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: estoqueAtual },
    { count: totalCategorias },
    { data: ultimasMovimentacoes },
  ] = await Promise.all([
    supabase.from("estoque_atual").select("*"),
    supabase.from("categorias").select("*", { count: "exact", head: true }),
    supabase
      .from("movimentacoes")
      .select("*, produtos(id, nome, unidade)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const rows = (estoqueAtual as EstoqueAtualRow[]) ?? [];
  const totalProdutos = rows.length;
  const valorEmEstoque = rows.reduce((acc, r) => acc + r.estoque_atual * r.preco_custo, 0);
  const estoqueBaixo = rows.filter((r) => r.estoque_atual <= r.estoque_minimo);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold text-black tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Visao geral do estoque</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="bg-white border border-zinc-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-150">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Produtos</span>
          <span className="text-4xl font-bold text-black">{totalProdutos}</span>
          <span className="text-xs text-zinc-400 border-t border-zinc-100 pt-2">cadastrados</span>
        </div>

        <div className="bg-white border border-zinc-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-150">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Categorias</span>
          <span className="text-4xl font-bold text-black">{totalCategorias ?? 0}</span>
          <span className="text-xs text-zinc-400 border-t border-zinc-100 pt-2">cadastradas</span>
        </div>

        <div className="bg-white border border-zinc-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-150">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Valor em estoque</span>
          <span className="text-2xl font-bold text-black leading-tight">{formatarMoeda(valorEmEstoque)}</span>
          <span className="text-xs text-zinc-400 border-t border-zinc-100 pt-2">preco de custo</span>
        </div>

        <div className={`border shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-150 ${
          estoqueBaixo.length > 0
            ? "bg-red-50 border-red-200"
            : "bg-white border-zinc-200"
        }`}>
          <span className={`text-xs font-semibold uppercase tracking-wider ${
            estoqueBaixo.length > 0 ? "text-red-500" : "text-zinc-500"
          }`}>
            Estoque baixo
          </span>
          <span className={`text-4xl font-bold ${
            estoqueBaixo.length > 0 ? "text-red-600" : "text-black"
          }`}>
            {estoqueBaixo.length}
          </span>
          <span className={`text-xs border-t pt-2 ${
            estoqueBaixo.length > 0
              ? "text-red-400 border-red-200"
              : "text-zinc-400 border-zinc-100"
          }`}>
            {estoqueBaixo.length > 0
              ? `produto${estoqueBaixo.length !== 1 ? "s" : ""} abaixo do minimo`
              : "tudo em ordem"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ultimas movimentacoes */}
        <section className="bg-white border border-zinc-200 shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-black">Ultimas movimentacoes</h2>
            <span className="text-xs text-zinc-400">ultimas 8</span>
          </div>

          {!ultimasMovimentacoes || ultimasMovimentacoes.length === 0 ? (
            <p className="text-sm text-zinc-400 p-5">Nenhuma movimentacao registrada.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="table-header">
                  <th className="table-th">Data</th>
                  <th className="table-th">Produto</th>
                  <th className="table-th">Tipo</th>
                  <th className="table-th-right">Qtd</th>
                </tr>
              </thead>
              <tbody>
                {(ultimasMovimentacoes as Movimentacao[]).map((mov, i) => (
                  <tr key={mov.id} className={`border-b border-zinc-100 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}>
                    <td className="py-2 px-4 text-zinc-500 whitespace-nowrap text-xs">
                      {new Date(mov.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-2 px-4 font-medium text-black text-xs">{mov.produtos?.nome ?? "—"}</td>
                    <td className="py-2 px-4">
                      <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 ${
                        mov.tipo === "entrada" ? "bg-black text-white" : "bg-zinc-200 text-zinc-700"
                      }`}>
                        {mov.tipo}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right text-black font-medium text-xs">
                      {mov.quantidade} {mov.produtos?.unidade ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Alertas */}
        <section className="bg-white border border-zinc-200 shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-black">Alertas de estoque</h2>
            {estoqueBaixo.length > 0 && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5">
                {estoqueBaixo.length} alerta{estoqueBaixo.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {estoqueBaixo.length === 0 ? (
            <p className="text-sm text-zinc-400 p-5">Todos os produtos estao acima do estoque minimo.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="table-header">
                  <th className="table-th">Produto</th>
                  <th className="table-th-right">Atual</th>
                  <th className="table-th-right">Minimo</th>
                </tr>
              </thead>
              <tbody>
                {estoqueBaixo.map((row, i) => (
                  <tr key={row.id} className={`border-b border-zinc-100 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}>
                    <td className="py-2 px-4 font-medium text-black text-xs">{row.nome}</td>
                    <td className="py-2 px-4 text-right font-bold text-red-600 text-xs">{row.estoque_atual}</td>
                    <td className="py-2 px-4 text-right text-zinc-500 text-xs">{row.estoque_minimo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

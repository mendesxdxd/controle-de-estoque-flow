import { createClient } from "@/lib/supabase/server";
import { EstoqueAtualRow, Movimentacao } from "@/types";
import { formatarMoeda } from "@/lib/utils";
import GraficoMovimentacoes from "./GraficoMovimentacoes";
import GraficoCapacidade from "./GraficoCapacidade";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: estoqueAtual },
    { count: totalCategorias },
    { data: ultimasMovimentacoes },
    { data: perfil },
  ] = await Promise.all([
    supabase.from("estoque_atual").select("*"),
    supabase.from("categorias").select("*", { count: "exact", head: true }),
    supabase
      .from("movimentacoes")
      .select("*, produtos(id, nome, unidade)")
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .order("created_at", { ascending: false }),
    supabase.from("perfis").select("pode_fechamento").eq("user_id", user?.id ?? "").single(),
  ]);

  const podeGraficos = perfil?.pode_fechamento ?? false;

  const rows = (estoqueAtual as EstoqueAtualRow[]) ?? [];
  const totalProdutos = rows.length;
  const valorEmEstoque = rows.reduce((acc, r) => acc + r.estoque_atual * r.preco_custo, 0);
  const estoqueBaixo = rows.filter((r) => r.estoque_atual <= r.estoque_minimo);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Visao geral do estoque</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4">

        {/* Produtos */}
        <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-4 hover:border-white/15 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Produtos</span>
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
          </div>
          <span className="text-5xl font-bold text-white tracking-tight">{totalProdutos}</span>
          <span className="text-xs text-zinc-600 border-t border-white/[0.06] pt-3">cadastrados</span>
        </div>

        {/* Categorias */}
        <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-4 hover:border-white/15 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Categorias</span>
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z" />
                <path d="M6 9.01V9" />
                <path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19" />
              </svg>
            </div>
          </div>
          <span className="text-5xl font-bold text-white tracking-tight">{totalCategorias ?? 0}</span>
          <span className="text-xs text-zinc-600 border-t border-white/[0.06] pt-3">cadastradas</span>
        </div>

        {/* Valor em estoque */}
        <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-4 hover:border-white/15 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Valor em estoque</span>
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" x2="12" y1="2" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <span className="text-3xl font-bold text-white tracking-tight leading-tight">{formatarMoeda(valorEmEstoque)}</span>
          <span className="text-xs text-zinc-600 border-t border-white/[0.06] pt-3">preco de custo</span>
        </div>

        {/* Estoque baixo */}
        <div className={`backdrop-blur-sm border rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 ${
          estoqueBaixo.length > 0
            ? "bg-red-950/30 border-red-800/40 hover:border-red-700/60"
            : "bg-zinc-900/60 border-white/[0.08] hover:border-white/15"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium uppercase tracking-wider ${estoqueBaixo.length > 0 ? "text-red-400" : "text-zinc-500"}`}>
              Estoque baixo
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${estoqueBaixo.length > 0 ? "bg-red-500/10 text-red-400" : "bg-white/5 text-zinc-400"}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
          </div>
          <span className={`text-5xl font-bold tracking-tight ${estoqueBaixo.length > 0 ? "text-red-400" : "text-white"}`}>
            {estoqueBaixo.length}
          </span>
          <span className={`text-xs border-t pt-3 ${estoqueBaixo.length > 0 ? "text-red-500/70 border-red-800/30" : "text-zinc-600 border-white/[0.06]"}`}>
            {estoqueBaixo.length > 0 ? `produto${estoqueBaixo.length !== 1 ? "s" : ""} abaixo do minimo` : "tudo em ordem"}
          </span>
        </div>
      </div>

      {/* Graficos */}
      {podeGraficos && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="bg-zinc-900/60 backdrop-blur-sm border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white">Movimentacao do dia</h2>
            </div>
            <div className="p-5">
              <GraficoMovimentacoes movimentacoes={(ultimasMovimentacoes as Movimentacao[]) ?? []} />
            </div>
          </section>

          <section className="bg-zinc-900/60 backdrop-blur-sm border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white">Capacidade do galpao</h2>
            </div>
            <div className="p-5">
              <GraficoCapacidade estoqueAtual={rows} />
            </div>
          </section>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Movimentacoes de hoje */}
        <section className="bg-zinc-900/60 backdrop-blur-sm border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Movimentacoes de hoje</h2>
            <span className="text-xs text-zinc-600">hoje</span>
          </div>

          {!ultimasMovimentacoes || ultimasMovimentacoes.length === 0 ? (
            <p className="text-sm text-zinc-500 p-5">Nenhuma movimentacao registrada.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-xs font-medium text-zinc-600 uppercase tracking-wider py-3 px-5">Data</th>
                  <th className="text-left text-xs font-medium text-zinc-600 uppercase tracking-wider py-3 px-5">Produto</th>
                  <th className="text-left text-xs font-medium text-zinc-600 uppercase tracking-wider py-3 px-5">Tipo</th>
                  <th className="text-right text-xs font-medium text-zinc-600 uppercase tracking-wider py-3 px-5">Qtd</th>
                </tr>
              </thead>
              <tbody>
                {(ultimasMovimentacoes as Movimentacao[]).map((mov, i) => (
                  <tr key={mov.id} className={`border-b border-white/[0.04] ${i % 2 === 0 ? "" : "bg-white/[0.02]"} hover:bg-white/[0.04] transition-colors`}>
                    <td className="py-3 px-5 text-zinc-500 whitespace-nowrap text-xs">
                      {new Date(mov.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3 px-5 font-medium text-white text-xs">{mov.produtos?.nome ?? "—"}</td>
                    <td className="py-3 px-5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        mov.tipo === "entrada"
                          ? "bg-indigo-500/15 text-indigo-400"
                          : "bg-zinc-700/50 text-zinc-400"
                      }`}>
                        {mov.tipo}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right text-white font-medium text-xs tabular-nums">
                      {mov.quantidade.toLocaleString("pt-BR")} {mov.produtos?.unidade ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Alertas */}
        <section className="bg-zinc-900/60 backdrop-blur-sm border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Alertas de estoque</h2>
            {estoqueBaixo.length > 0 && (
              <span className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                {estoqueBaixo.length} alerta{estoqueBaixo.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {estoqueBaixo.length === 0 ? (
            <p className="text-sm text-zinc-500 p-5">Todos os produtos estao acima do estoque minimo.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-xs font-medium text-zinc-600 uppercase tracking-wider py-3 px-5">Produto</th>
                  <th className="text-right text-xs font-medium text-zinc-600 uppercase tracking-wider py-3 px-5">Atual</th>
                  <th className="text-right text-xs font-medium text-zinc-600 uppercase tracking-wider py-3 px-5">Minimo</th>
                </tr>
              </thead>
              <tbody>
                {estoqueBaixo.map((row, i) => (
                  <tr key={row.id} className={`border-b border-white/[0.04] ${i % 2 === 0 ? "" : "bg-white/[0.02]"} hover:bg-white/[0.04] transition-colors`}>
                    <td className="py-3 px-5 font-medium text-white text-xs">{row.nome}</td>
                    <td className="py-3 px-5 text-right font-bold text-red-400 text-xs tabular-nums">{row.estoque_atual.toLocaleString("pt-BR")}</td>
                    <td className="py-3 px-5 text-right text-zinc-500 text-xs tabular-nums">{row.estoque_minimo.toLocaleString("pt-BR")}</td>
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

import { createClient } from "@/lib/supabase/server";
import { Movimentacao, Produto } from "@/types";
import TabelaEstoque from "./TabelaEstoque";

export default async function EstoquePage() {
  const supabase = await createClient();

  const [{ data: movimentacoes }, { data: produtos }] = await Promise.all([
    supabase
      .from("movimentacoes")
      .select("*, produtos(id, nome, unidade)")
      .order("created_at", { ascending: false }),
    supabase
      .from("produtos")
      .select("id, nome, unidade")
      .order("nome"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-black tracking-tight">Estoque</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {movimentacoes?.length ?? 0} movimentacao{(movimentacoes?.length ?? 0) !== 1 ? "s" : ""} registrada{(movimentacoes?.length ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>

      <TabelaEstoque
        movimentacoes={(movimentacoes as Movimentacao[]) ?? []}
        produtos={(produtos as Produto[]) ?? []}
      />
    </div>
  );
}

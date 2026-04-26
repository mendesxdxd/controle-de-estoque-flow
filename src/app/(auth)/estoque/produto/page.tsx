import { createClient } from "@/lib/supabase/server";
import { Movimentacao, Produto } from "@/types";
import PorProduto from "./PorProduto";

export default async function PorProdutoPage() {
  const supabase = await createClient();

  const [{ data: movimentacoes }, { data: produtos }] = await Promise.all([
    supabase
      .from("movimentacoes")
      .select("*, produtos(id, nome, unidade)")
      .or("observacao.neq.AJUSTE_INICIAL,observacao.is.null")
      .order("created_at", { ascending: false }),
    supabase
      .from("produtos")
      .select("id, nome, unidade")
      .order("nome"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PorProduto
        movimentacoes={(movimentacoes as Movimentacao[]) ?? []}
        produtos={(produtos as Produto[]) ?? []}
      />
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { Movimentacao, Produto } from "@/types";
import PorProduto from "./PorProduto";

export default async function PorProdutoPage() {
  const supabase = await createClient();
  const tenant = await getTenant();
  if (!tenant) return null;

  const [{ data: movimentacoes }, { data: produtos }] = await Promise.all([
    supabase
      .from("movimentacoes")
      .select("*, produtos(id, nome, unidade)")
      .eq("tenant_id", tenant.id)
      .or("observacao.neq.AJUSTE_INICIAL,observacao.is.null")
      .order("created_at", { ascending: false })
      .limit(10000),
    supabase
      .from("produtos")
      .select("id, nome, unidade")
      .eq("tenant_id", tenant.id)
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

import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { Movimentacao } from "@/types";
import ResumoEstoque from "./ResumoEstoque";

export default async function ResumoPage() {
  const supabase = await createClient();
  const tenant = await getTenant();
  if (!tenant) return null;

  const { data: movimentacoes } = await supabase
    .from("movimentacoes")
    .select("*, produtos(id, nome, unidade)")
    .eq("tenant_id", tenant.id)
    .or("observacao.neq.AJUSTE_INICIAL,observacao.is.null")
    .order("created_at", { ascending: false })
    .limit(10000);

  return (
    <div className="flex flex-col gap-8">
      <ResumoEstoque movimentacoes={(movimentacoes as Movimentacao[]) ?? []} />
    </div>
  );
}

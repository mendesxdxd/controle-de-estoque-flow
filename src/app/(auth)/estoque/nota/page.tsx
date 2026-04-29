import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { Movimentacao } from "@/types";
import PorNota from "./PorNota";

export default async function PorNotaPage() {
  const supabase = await createClient();
  const tenant = await getTenant();
  if (!tenant) return null;

  const { data: movimentacoes } = await supabase
    .from("movimentacoes")
    .select("*, produtos(id, nome, unidade, caixas_por_palete)")
    .eq("tenant_id", tenant.id)
    .or("observacao.neq.AJUSTE_INICIAL,observacao.is.null")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <PorNota movimentacoes={(movimentacoes as Movimentacao[]) ?? []} />
    </div>
  );
}

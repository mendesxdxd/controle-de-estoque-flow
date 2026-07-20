import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { OrdemFrete } from "@/types";
import Conferencia, { BaixaDetalhada } from "./Conferencia";

export default async function ConferenciaPage() {
  const supabase = await createClient();
  const tenant = await getTenant();
  if (!tenant) return null;

  const [{ data: ofs }, { data: baixas }] = await Promise.all([
    supabase
      .from("ofs")
      .select("*, notas(*, produtos(id, nome, unidade, caixas_por_palete))")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("nota_baixas")
      .select(
        "*, notas(id, numero, nf_palete, produto_id, produtos(id, nome, unidade, caixas_por_palete), ofs(numero))"
      )
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(10000),
  ]);

  return (
    <Conferencia
      ofs={(ofs as OrdemFrete[]) ?? []}
      baixas={(baixas as BaixaDetalhada[]) ?? []}
      role={tenant.role}
    />
  );
}

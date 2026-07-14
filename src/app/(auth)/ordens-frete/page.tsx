import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { OrdemFrete, NotaSaldo, NotaBaixa } from "@/types";
import OrdensFrete from "./OrdensFrete";

export default async function OrdensFretePage() {
  const supabase = await createClient();
  const tenant = await getTenant();
  if (!tenant) return null;

  const [{ data: ofs }, { data: saldos }, { data: baixas }] = await Promise.all([
    supabase
      .from("ofs")
      .select("*, notas(*, produtos(id, nome, unidade, caixas_por_palete))")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("notas_saldo")
      .select("*")
      .eq("tenant_id", tenant.id),
    supabase
      .from("nota_baixas")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false })
      .limit(10000),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <OrdensFrete
        ofsIniciais={(ofs as OrdemFrete[]) ?? []}
        saldos={(saldos as NotaSaldo[]) ?? []}
        baixas={(baixas as NotaBaixa[]) ?? []}
        role={tenant.role}
      />
    </div>
  );
}

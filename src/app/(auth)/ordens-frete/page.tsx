import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { getRole } from "@/lib/permissoes";
import { OrdemFrete, NotaSaldo } from "@/types";
import OrdensFrete from "./OrdensFrete";

export default async function OrdensFretePage() {
  const supabase = await createClient();
  const tenant = await getTenant();
  if (!tenant) return null;

  const role = await getRole();

  // O historico de baixas saiu desta tela (agora vive em Conferencia), entao a
  // consulta a nota_baixas deixou de ser necessaria aqui.
  const [{ data: ofs }, { data: saldos }] = await Promise.all([
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
  ]);

  return (
    <div className="flex flex-col gap-8">
      <OrdensFrete
        ofsIniciais={(ofs as OrdemFrete[]) ?? []}
        saldos={(saldos as NotaSaldo[]) ?? []}
        podeEditar={role === "admin"}
      />
    </div>
  );
}

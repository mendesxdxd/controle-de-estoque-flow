import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { Movimentacao, Produto, OrdemFrete, NotaSaldo } from "@/types";
import TabelaEstoque from "./TabelaEstoque";

export default async function EstoquePage() {
  const supabase = await createClient();
  const tenant = await getTenant();

  if (!tenant) return null;

  const [{ data: movimentacoes }, { data: produtos }, { data: ofs }, { data: saldos }] = await Promise.all([
    supabase
      .from("movimentacoes")
      .select("*, produtos(id, nome, unidade)")
      .eq("tenant_id", tenant.id)
      .or("observacao.neq.AJUSTE_INICIAL,observacao.is.null")
      .order("created_at", { ascending: false })
      .limit(10000),
    supabase
      .from("produtos")
      .select("id, nome, unidade, caixas_por_palete")
      .eq("tenant_id", tenant.id)
      .order("nome"),
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
      <TabelaEstoque
        movimentacoes={(movimentacoes as Movimentacao[]) ?? []}
        produtos={(produtos as Produto[]) ?? []}
        ofs={(ofs as OrdemFrete[]) ?? []}
        saldos={(saldos as NotaSaldo[]) ?? []}
        notaObrigatoria={tenant?.nota_obrigatoria ?? false}
        role={tenant.role}
      />
    </div>
  );
}

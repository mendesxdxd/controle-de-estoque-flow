import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { Movimentacao, Produto } from "@/types";
import TabelaEstoque from "./TabelaEstoque";

export default async function EstoquePage() {
  const supabase = await createClient();
  const tenant = await getTenant();

  const [{ data: movimentacoes }, { data: produtos }] = await Promise.all([
    supabase
      .from("movimentacoes")
      .select("*, produtos(id, nome, unidade)")
      .or("observacao.neq.AJUSTE_INICIAL,observacao.is.null")
      .order("created_at", { ascending: false }),
    supabase
      .from("produtos")
      .select("id, nome, unidade, caixas_por_palete")
      .order("nome"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <TabelaEstoque
        movimentacoes={(movimentacoes as Movimentacao[]) ?? []}
        produtos={(produtos as Produto[]) ?? []}
        notaObrigatoria={tenant?.nota_obrigatoria ?? false}
      />
    </div>
  );
}

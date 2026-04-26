import { createClient } from "@/lib/supabase/server";
import { Movimentacao } from "@/types";
import ResumoEstoque from "./ResumoEstoque";

export default async function ResumoPage() {
  const supabase = await createClient();

  const { data: movimentacoes } = await supabase
    .from("movimentacoes")
    .select("*, produtos(id, nome, unidade)")
    .neq("observacao", "AJUSTE_INICIAL")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <ResumoEstoque movimentacoes={(movimentacoes as Movimentacao[]) ?? []} />
    </div>
  );
}

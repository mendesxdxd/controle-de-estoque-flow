import { createClient } from "@/lib/supabase/server";
import { Movimentacao } from "@/types";
import PorNota from "./PorNota";

export default async function PorNotaPage() {
  const supabase = await createClient();

  const { data: movimentacoes } = await supabase
    .from("movimentacoes")
    .select("*, produtos(id, nome, unidade)")
    .or("observacao.neq.AJUSTE_INICIAL,observacao.is.null")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <PorNota movimentacoes={(movimentacoes as Movimentacao[]) ?? []} />
    </div>
  );
}

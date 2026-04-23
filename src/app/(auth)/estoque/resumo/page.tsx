import { createClient } from "@/lib/supabase/server";
import { Movimentacao } from "@/types";
import ResumoEstoque from "./ResumoEstoque";

export default async function ResumoPage() {
  const supabase = await createClient();

  const { data: movimentacoes } = await supabase
    .from("movimentacoes")
    .select("*, produtos(id, nome, unidade)")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="page-title">Resumo do dia</h1>
        <p className="page-subtitle">Entradas e saidas agrupadas por produto</p>
      </div>
      <ResumoEstoque movimentacoes={(movimentacoes as Movimentacao[]) ?? []} />
    </div>
  );
}

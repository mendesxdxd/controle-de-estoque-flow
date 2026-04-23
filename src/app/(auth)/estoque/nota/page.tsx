import { createClient } from "@/lib/supabase/server";
import { Movimentacao } from "@/types";
import PorNota from "./PorNota";

export default async function PorNotaPage() {
  const supabase = await createClient();

  const { data: movimentacoes } = await supabase
    .from("movimentacoes")
    .select("*, produtos(id, nome, unidade)")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="page-title">Por nota fiscal</h1>
        <p className="page-subtitle">Busque todas as movimentacoes de uma nota</p>
      </div>
      <PorNota movimentacoes={(movimentacoes as Movimentacao[]) ?? []} />
    </div>
  );
}

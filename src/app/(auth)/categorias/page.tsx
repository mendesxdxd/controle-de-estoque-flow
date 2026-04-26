import { createClient } from "@/lib/supabase/server";
import { Categoria } from "@/types";
import TabelaCategorias from "./TabelaCategorias";

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data: categorias } = await supabase
    .from("categorias")
    .select("*")
    .order("nome");

  return (
    <div className="flex flex-col gap-8">
      <TabelaCategorias categorias={(categorias as Categoria[]) ?? []} />
    </div>
  );
}

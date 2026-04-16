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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Categorias</h1>
          <p className="page-subtitle">
            {categorias?.length ?? 0} categoria{(categorias?.length ?? 0) !== 1 ? "s" : ""} cadastrada{(categorias?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <TabelaCategorias categorias={(categorias as Categoria[]) ?? []} />
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { Produto, Categoria } from "@/types";
import TabelaProdutos from "./TabelaProdutos";

export default async function ProdutosPage() {
  const supabase = await createClient();

  const [{ data: produtos }, { data: categorias }] = await Promise.all([
    supabase
      .from("produtos")
      .select("*, categorias(id, nome)")
      .order("nome"),
    supabase
      .from("categorias")
      .select("id, nome")
      .order("nome"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="page-title">Produtos</h1>
        <p className="page-subtitle">
          {produtos?.length ?? 0} produto{(produtos?.length ?? 0) !== 1 ? "s" : ""} cadastrado{(produtos?.length ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>

      <TabelaProdutos
        produtos={(produtos as Produto[]) ?? []}
        categorias={(categorias as Categoria[]) ?? []}
      />
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { Produto, Categoria } from "@/types";
import TabelaProdutos from "./TabelaProdutos";

export default async function ProdutosPage() {
  const supabase = await createClient();
  const tenant = await getTenant();

  if (!tenant) return null;

  const [{ data: produtos }, { data: categorias }] = await Promise.all([
    supabase
      .from("produtos")
      .select("*, categorias(id, nome)")
      .eq("tenant_id", tenant.id)
      .order("nome"),
    supabase
      .from("categorias")
      .select("id, nome")
      .eq("tenant_id", tenant.id)
      .order("nome"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <TabelaProdutos
        produtos={(produtos as Produto[]) ?? []}
        categorias={(categorias as Categoria[]) ?? []}
      />
    </div>
  );
}

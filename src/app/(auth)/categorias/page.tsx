import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { Categoria } from "@/types";
import TabelaCategorias from "./TabelaCategorias";

export default async function CategoriasPage() {
  const supabase = await createClient();
  const tenant = await getTenant();

  if (!tenant) return null;

  const { data: categorias } = await supabase
    .from("categorias")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("nome");

  return (
    <div className="flex flex-col gap-8">
      <TabelaCategorias categorias={(categorias as Categoria[]) ?? []} />
    </div>
  );
}

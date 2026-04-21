import { createClient } from "@/lib/supabase/server";

export async function getTenant() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select("tenant_id, pode_fechamento")
    .eq("user_id", user.id)
    .single();

  if (!perfil?.tenant_id) return null;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, nome, capacidade_armazem")
    .eq("id", perfil.tenant_id)
    .single();

  return tenant ? { ...tenant, pode_fechamento: perfil.pode_fechamento ?? false } : null;
}

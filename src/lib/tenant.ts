import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getTenant = cache(async function getTenant() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil, error: perfilError } = await supabase
    .from("perfis")
    .select("tenant_id, pode_fechamento, nota_obrigatoria, role")
    .eq("user_id", user.id)
    .single();

  if (perfilError || !perfil?.tenant_id) return null;

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, nome, capacidade_armazem")
    .eq("id", perfil.tenant_id)
    .single();

  if (tenantError) return null;

  return tenant ? {
    ...tenant,
    pode_fechamento: perfil.pode_fechamento ?? false,
    nota_obrigatoria: perfil.nota_obrigatoria ?? false,
    role: (perfil.role ?? "admin") as "admin" | "operador" | "visualizador",
  } : null;
});
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verificarAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

export async function listarUsuarios() {
  await verificarAdmin();
  const admin = createAdminClient();

  const { data: authData, error } = await admin.auth.admin.listUsers();
  if (error) return { erro: "Erro ao listar usuarios.", usuarios: [] };

  const { data: perfis } = await admin
    .from("perfis")
    .select("user_id, nome, tenant_id, tenants(nome)");

  const perfilMap = new Map((perfis ?? []).map((p) => [p.user_id, p]));
  const usuarios = authData.users.map((u) => {
    const perfil = perfilMap.get(u.id);
    const tenant = perfil?.tenants as unknown as { nome: string } | null;
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      nome: perfil?.nome ?? null,
      tenant_id: perfil?.tenant_id ?? null,
      tenant_nome: tenant?.nome ?? null,
    };
  });

  return { usuarios };
}


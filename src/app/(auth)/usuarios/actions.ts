"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verificarAdmin } from "@/lib/admin";

export async function listarUsuarios() {
  await verificarAdmin();
  const admin = createAdminClient();

  let page = 1;
  const perPage = 1000;
  const { data: first, error } = await admin.auth.admin.listUsers({ page, perPage });
  if (error) return { erro: "Erro ao listar usuarios.", usuarios: [] };
  const allUsers = [...(first?.users ?? [])];
  while (allUsers.length === page * perPage) {
    page++;
    const { data } = await admin.auth.admin.listUsers({ page, perPage });
    const users = data?.users ?? [];
    if (users.length === 0) break;
    allUsers.push(...users);
  }

  const { data: perfis } = await admin
    .from("perfis")
    .select("user_id, nome, tenant_id, tenants(nome)");

  const perfilMap = new Map((perfis ?? []).map((p) => [p.user_id, p]));
  const usuarios = allUsers.map((u) => {
    const perfil = perfilMap.get(u.id);
    const rawTenant = (perfil?.tenants ?? null) as { nome: string } | { nome: string }[] | null;
    const tenantNome = rawTenant == null ? null
      : Array.isArray(rawTenant) ? (rawTenant[0]?.nome ?? null)
      : rawTenant.nome;
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      nome: perfil?.nome ?? null,
      tenant_id: perfil?.tenant_id ?? null,
      tenant_nome: tenantNome,
    };
  });

  return { usuarios };
}


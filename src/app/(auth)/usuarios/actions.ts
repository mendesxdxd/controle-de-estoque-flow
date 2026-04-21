"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/admin";
import { revalidatePath } from "next/cache";

async function verificarAdmin() {
  if (!(await isAdminUser())) throw new Error("Acesso negado.");
}

export async function listarUsuarios() {
  await verificarAdmin();
  const admin = createAdminClient();

  const { data: authData, error } = await admin.auth.admin.listUsers();
  if (error) return { erro: "Erro ao listar usuarios.", usuarios: [] };

  const { data: perfis } = await admin
    .from("perfis")
    .select("user_id, nome, pode_fechamento, tenant_id, tenants(nome)");

  const usuarios = authData.users.map((u) => {
    const perfil = (perfis ?? []).find((p) => p.user_id === u.id);
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      nome: perfil?.nome ?? null,
      pode_fechamento: perfil?.pode_fechamento ?? false,
      tenant_nome: (perfil?.tenants as any)?.nome ?? null,
    };
  });

  return { usuarios };
}

export async function criarUsuario(email: string, senha: string) {
  await verificarAdmin();
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (error) return { erro: error.message };

  revalidatePath("/usuarios");
}

export async function excluirUsuario(id: string) {
  await verificarAdmin();
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { erro: "Erro ao excluir usuario." };

  revalidatePath("/usuarios");
}

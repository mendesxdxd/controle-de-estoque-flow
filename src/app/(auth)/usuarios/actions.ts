"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function verificarAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error("Acesso negado.");
  }
  return user;
}

export async function listarUsuarios() {
  await verificarAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) return { erro: "Erro ao listar usuarios.", usuarios: [] };
  return { usuarios: data.users };
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

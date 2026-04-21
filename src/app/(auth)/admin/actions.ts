"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function verificarAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error("Acesso negado.");
  }
  return user;
}

export async function listarTenants() {
  await verificarAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return { erro: "Erro ao listar clientes.", tenants: [] };
  return { tenants: data };
}

export async function criarTenant(nome: string, capacidadeArmazem: number | null) {
  await verificarAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("tenants")
    .insert({ nome, capacidade_armazem: capacidadeArmazem });
  if (error) return { erro: "Erro ao criar cliente." };
  revalidatePath("/admin");
}

export async function excluirTenant(id: string) {
  await verificarAdmin();
  const admin = createAdminClient();

  const { data: perfis } = await admin.from("perfis").select("user_id").eq("tenant_id", id);

  await admin.from("movimentacoes").delete().eq("tenant_id", id);
  await admin.from("estoque_atual").delete().eq("tenant_id", id);
  await admin.from("produtos").delete().eq("tenant_id", id);
  await admin.from("categorias").delete().eq("tenant_id", id);
  await admin.from("perfis").delete().eq("tenant_id", id);

  for (const perfil of perfis ?? []) {
    await admin.auth.admin.deleteUser(perfil.user_id);
  }

  const { error } = await admin.from("tenants").delete().eq("id", id);
  if (error) return { erro: "Erro ao excluir cliente." };

  revalidatePath("/admin");
}

export async function atualizarTenant(id: string, nome: string, capacidadeArmazem: number | null) {
  await verificarAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("tenants")
    .update({ nome, capacidade_armazem: capacidadeArmazem })
    .eq("id", id);
  if (error) return { erro: "Erro ao atualizar cliente." };
  revalidatePath("/admin");
  revalidatePath(`/admin/clientes/${id}`);
}

export async function listarUsuariosTenant(tenantId: string) {
  await verificarAdmin();
  const admin = createAdminClient();

  const { data: perfis } = await admin
    .from("perfis")
    .select("user_id, pode_fechamento, nome")
    .eq("tenant_id", tenantId);

  if (!perfis || perfis.length === 0) return { usuarios: [] };

  const { data: authData } = await admin.auth.admin.listUsers();
  const usuarios = (authData?.users ?? [])
    .filter((u) => perfis.some((p) => p.user_id === u.id))
    .map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      pode_fechamento: perfis.find((p) => p.user_id === u.id)?.pode_fechamento ?? false,
      nome: perfis.find((p) => p.user_id === u.id)?.nome ?? null,
    }));

  return { usuarios };
}

export async function criarUsuarioTenant(
  email: string,
  senha: string,
  tenantId: string,
  podeFechamento: boolean,
  nome: string
) {
  await verificarAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (error) return { erro: error.message };

  const { error: perfilError } = await admin
    .from("perfis")
    .insert({ user_id: data.user.id, tenant_id: tenantId, pode_fechamento: podeFechamento, nome });

  if (perfilError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { erro: "Erro ao vincular usuario ao cliente." };
  }

  revalidatePath(`/admin/clientes/${tenantId}`);
}

export async function listarUsuariosSemTenant() {
  await verificarAdmin();
  const admin = createAdminClient();

  const { data: authData } = await admin.auth.admin.listUsers();
  const { data: perfis } = await admin.from("perfis").select("user_id");

  const idsComTenant = new Set((perfis ?? []).map((p) => p.user_id));
  const usuarios = (authData?.users ?? [])
    .filter((u) => !idsComTenant.has(u.id))
    .map((u) => ({ id: u.id, email: u.email ?? "" }));

  return { usuarios };
}

export async function vincularUsuarioExistente(
  userId: string,
  tenantId: string,
  nome: string,
  podeFechamento: boolean
) {
  await verificarAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("perfis")
    .insert({ user_id: userId, tenant_id: tenantId, nome, pode_fechamento: podeFechamento });
  if (error) return { erro: "Erro ao vincular usuario." };
  revalidatePath(`/admin/clientes/${tenantId}`);
}

export async function atualizarPermissao(userId: string, podeFechamento: boolean, tenantId: string) {
  await verificarAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("perfis")
    .update({ pode_fechamento: podeFechamento })
    .eq("user_id", userId);
  if (error) return { erro: "Erro ao atualizar permissao." };
  revalidatePath(`/admin/clientes/${tenantId}`);
}

export async function excluirUsuarioTenant(userId: string, tenantId: string) {
  await verificarAdmin();
  const admin = createAdminClient();

  await admin.from("perfis").delete().eq("user_id", userId);
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { erro: "Erro ao excluir usuario." };

  revalidatePath(`/admin/clientes/${tenantId}`);
}

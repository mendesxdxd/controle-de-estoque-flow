"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verificarAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

export async function listarTenants() {
  await verificarAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return { erro: "Erro ao listar empresas.", tenants: [] };
  return { tenants: data ?? [] };
}

export async function criarTenant(nome: string, capacidadeArmazem: number | null) {
  await verificarAdmin();
  if (!nome.trim()) return { erro: "Nome e obrigatorio." };
  if (capacidadeArmazem !== null && capacidadeArmazem < 0) return { erro: "Capacidade invalida." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("tenants")
    .insert({ nome: nome.trim(), capacidade_armazem: capacidadeArmazem });
  if (error) return { erro: "Erro ao criar empresa." };
  revalidatePath("/admin");
  return { sucesso: true };
}

export async function excluirTenant(id: string, senhaAdmin: string) {
  await verificarAdmin();

  const supabase = await (await import("@/lib/supabase/server")).createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user!.email!,
    password: senhaAdmin,
  });
  if (authError) return { erro: "Senha incorreta." };

  const admin = createAdminClient();
  const { data: perfis } = await admin.from("perfis").select("user_id").eq("tenant_id", id);

  try {
    await admin.from("movimentacoes").delete().eq("tenant_id", id);
    await admin.from("produtos").delete().eq("tenant_id", id);
    await admin.from("categorias").delete().eq("tenant_id", id);
    await admin.from("perfis").delete().eq("tenant_id", id);

    for (const perfil of perfis ?? []) {
      await admin.auth.admin.deleteUser(perfil.user_id);
    }

    const { error } = await admin.from("tenants").delete().eq("id", id);
    if (error) return { erro: "Erro ao excluir empresa." };
  } catch {
    return { erro: "Erro ao excluir dados da empresa." };
  }

  revalidatePath("/admin");
  return { sucesso: true };
}

export async function atualizarTenant(id: string, nome: string, capacidadeArmazem: number | null, notaObrigatoria: boolean = false) {
  await verificarAdmin();
  if (!nome.trim()) return { erro: "Nome e obrigatorio." };
  if (capacidadeArmazem !== null && capacidadeArmazem < 0) return { erro: "Capacidade invalida." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("tenants")
    .update({ nome: nome.trim(), capacidade_armazem: capacidadeArmazem, nota_obrigatoria: notaObrigatoria })
    .eq("id", id);
  if (error) return { erro: "Erro ao atualizar empresa." };
  revalidatePath("/admin");
  revalidatePath(`/admin/clientes/${id}`);
  return { sucesso: true };
}

export async function listarUsuariosTenant(tenantId: string) {
  await verificarAdmin();
  const admin = createAdminClient();

  const { data: perfis } = await admin
    .from("perfis")
    .select("user_id, pode_fechamento, nota_obrigatoria, nome, role")
    .eq("tenant_id", tenantId);

  if (!perfis || perfis.length === 0) return { usuarios: [] };

  const { data: authData } = await admin.auth.admin.listUsers();
  const perfilMap = new Map(perfis.map((p) => [p.user_id, p]));
  const usuarios = (authData?.users ?? [])
    .filter((u) => perfilMap.has(u.id))
    .map((u) => {
      const perfil = perfilMap.get(u.id)!;
      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        pode_fechamento: perfil.pode_fechamento ?? false,
        nota_obrigatoria: perfil.nota_obrigatoria ?? false,
        nome: perfil.nome ?? null,
        role: (perfil.role as "admin" | "operador" | "visualizador") ?? "admin",
      };
    });

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
  if (!email.trim()) return { erro: "Email e obrigatorio." };
  if (!senha || senha.length < 6) return { erro: "Senha deve ter pelo menos 6 caracteres." };

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: email.trim(),
    password: senha,
    email_confirm: true,
  });

  if (error) return { erro: error.message ?? "Erro ao criar usuario." };

  const { error: perfilError } = await admin
    .from("perfis")
    .insert({ user_id: data.user.id, tenant_id: tenantId, pode_fechamento: podeFechamento, nome });

  if (perfilError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { erro: "Erro ao vincular usuario a empresa." };
  }

  revalidatePath(`/admin/clientes/${tenantId}`);
  return { sucesso: true };
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
  return { sucesso: true };
}

export async function atualizarPermissao(
  userId: string,
  tenantId: string,
  campo: "pode_fechamento" | "nota_obrigatoria",
  valor: boolean
) {
  await verificarAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("perfis")
    .update({ [campo]: valor })
    .eq("user_id", userId)
    .eq("tenant_id", tenantId);
  if (error) return { erro: "Erro ao atualizar permissao." };
  revalidatePath(`/admin/clientes/${tenantId}`);
  return { sucesso: true };
}

export async function atualizarRole(
  userId: string,
  tenantId: string,
  role: "admin" | "operador" | "visualizador"
) {
  await verificarAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("perfis")
    .update({ role })
    .eq("user_id", userId)
    .eq("tenant_id", tenantId);
  if (error) return { erro: "Erro ao atualizar role." };
  revalidatePath(`/admin/clientes/${tenantId}`);
  return { sucesso: true };
}

export async function desvincularUsuario(userId: string, tenantId: string) {
  await verificarAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("perfis")
    .delete()
    .eq("user_id", userId)
    .eq("tenant_id", tenantId);
  if (error) return { erro: "Erro ao desvincular usuario." };
  revalidatePath(`/admin/clientes/${tenantId}`);
  return { sucesso: true };
}

export async function gerarConvite() {
  await verificarAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("convites")
    .insert({})
    .select("token")
    .single();
  if (error) return { erro: "Erro ao gerar convite." };
  revalidatePath("/admin");
  return { token: data.token };
}

export async function listarConvites() {
  await verificarAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("convites")
    .select("id, token, usado, criado_em")
    .order("criado_em", { ascending: false });
  return { convites: data ?? [] };
}

export async function excluirConvite(id: string) {
  await verificarAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("convites").delete().eq("id", id);
  if (error) return { erro: "Erro ao excluir convite." };
  revalidatePath("/admin");
  return { sucesso: true };
}

export async function excluirUsuarioTenantComSenha(
  userId: string,
  emailUsuario: string,
  tenantId: string,
  senhaAdmin: string
) {
  await verificarAdmin();
  const supabase = await (await import("@/lib/supabase/server")).createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user!.email!,
    password: senhaAdmin,
  });
  if (authError) return { erro: "Senha incorreta." };

  const admin = createAdminClient();
  const { data: usuarioAlvo } = await admin.auth.admin.getUserById(userId);
  if (usuarioAlvo?.user?.email !== emailUsuario) return { erro: "Email do usuario incorreto." };

  await admin.from("perfis").delete().eq("user_id", userId).eq("tenant_id", tenantId);
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { erro: "Erro ao excluir usuario." };

  revalidatePath(`/admin/clientes/${tenantId}`);
  return { sucesso: true };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { exigirRole } from "@/lib/permissoes";
import { revalidatePath } from "next/cache";

type DadosCategoria = {
  id?: string;
  nome: string;
  descricao: string | null;
};

export async function salvarCategoria(dados: DadosCategoria) {
  try { await exigirRole("admin"); } catch { return { erro: "Sem permissao para gerenciar categorias." }; }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: "Nao autenticado." };

  const tenant = await getTenant();
  if (!tenant) return { erro: "Tenant nao encontrado." };

  if (dados.id) {
    const { error } = await supabase
      .from("categorias")
      .update({ nome: dados.nome, descricao: dados.descricao })
      .eq("id", dados.id)
      .eq("tenant_id", tenant.id);

    if (error) return { erro: "Erro ao atualizar categoria." };
  } else {
    const { error } = await supabase
      .from("categorias")
      .insert({ nome: dados.nome, descricao: dados.descricao, user_id: user.id, tenant_id: tenant.id });

    if (error) return { erro: "Erro ao criar categoria." };
  }

  revalidatePath("/categorias");
  return { sucesso: true };
}

export async function excluirCategoria(id: string) {
  try { await exigirRole("admin"); } catch { return { erro: "Sem permissao para excluir categorias." }; }
  const supabase = await createClient();
  const tenant = await getTenant();
  if (!tenant) return { erro: "Tenant nao encontrado." };

  const { error } = await supabase
    .from("categorias")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  if (error) return { erro: "Erro ao excluir categoria." };

  revalidatePath("/categorias");
  return { sucesso: true };
}

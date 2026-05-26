"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { exigirRole } from "@/lib/permissoes";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schemaCategoria = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1).max(200),
  descricao: z.string().max(500).nullable(),
});

export async function salvarCategoria(dados: z.infer<typeof schemaCategoria>) {
  try { await exigirRole("admin"); } catch { return { erro: "Sem permissao para gerenciar categorias." }; }

  const parse = schemaCategoria.safeParse(dados);
  if (!parse.success) return { erro: parse.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: "Nao autenticado." };

  const tenant = await getTenant();
  if (!tenant) return { erro: "Tenant nao encontrado." };

  const { id, ...rest } = parse.data;

  if (id) {
    const { error } = await supabase
      .from("categorias")
      .update({ nome: rest.nome, descricao: rest.descricao })
      .eq("id", id)
      .eq("tenant_id", tenant.id);

    if (error) return { erro: "Erro ao atualizar categoria." };
  } else {
    const { error } = await supabase
      .from("categorias")
      .insert({ nome: rest.nome, descricao: rest.descricao, user_id: user.id, tenant_id: tenant.id });

    if (error) return { erro: "Erro ao criar categoria." };
  }

  revalidatePath("/categorias");
  return { sucesso: true };
}

export async function excluirCategoria(id: string) {
  try { await exigirRole("admin"); } catch { return { erro: "Sem permissao para excluir categorias." }; }

  if (!z.string().uuid().safeParse(id).success) return { erro: "ID invalido." };

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

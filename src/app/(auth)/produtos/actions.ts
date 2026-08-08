"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { exigirRole } from "@/lib/permissoes";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAuditoria } from "@/lib/auditoria";

const schemaProduto = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1).max(200),
  codigo: z.string().max(100).nullable(),
  categoria_id: z.string().uuid().nullable(),
  unidade: z.string().min(1).max(20),
  estoque_minimo: z.number().int().nonnegative(),
  caixas_por_palete: z.number().int().positive().nullable(),
});

type DadosProduto = z.infer<typeof schemaProduto>;

export async function salvarProduto(dados: DadosProduto) {
  try { await exigirRole("admin"); } catch { return { erro: "Sem permissao para gerenciar produtos." }; }

  const parse = schemaProduto.safeParse(dados);
  if (!parse.success) return { erro: parse.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: "Nao autenticado." };

  const tenant = await getTenant();
  if (!tenant) return { erro: "Tenant nao encontrado." };

  const { id, ...rest } = parse.data;
  const payload = {
    nome: rest.nome,
    codigo: rest.codigo,
    categoria_id: rest.categoria_id,
    unidade: rest.unidade,
    estoque_minimo: rest.estoque_minimo,
    caixas_por_palete: rest.caixas_por_palete,
  };

  if (dados.id) {
    const { error } = await supabase
      .from("produtos")
      .update(payload)
      .eq("id", dados.id)
      .eq("tenant_id", tenant.id);

    if (error) return { erro: "Erro ao atualizar produto." };
  } else {
    const { error } = await supabase
      .from("produtos")
      .insert({ ...payload, user_id: user.id, tenant_id: tenant.id });

    if (error) return { erro: "Erro ao criar produto." };
  }

  revalidatePath("/produtos");
  return { sucesso: true };
}

export async function excluirProduto(id: string) {
  try { await exigirRole("admin"); } catch { return { erro: "Sem permissao para excluir produtos." }; }
  const supabase = await createClient();
  const tenant = await getTenant();
  if (!tenant) return { erro: "Tenant nao encontrado." };

  const { data: produto } = await supabase
    .from("produtos")
    .select("nome")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .single();

  const { error } = await supabase
    .from("produtos")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  if (error) return { erro: "Erro ao excluir produto." };

  await logAuditoria({
    acao: "excluir_produto",
    tabela: "produtos",
    registro_id: id,
    tenant_id: tenant.id,
    detalhes: { nome: produto?.nome },
  });

  revalidatePath("/produtos");
  return { sucesso: true };
}
"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

type DadosProduto = {
  id?: string;
  nome: string;
  codigo: string | null;
  categoria_id: string | null;
  unidade: string;
  preco_custo: number;
  preco_venda: number;
  estoque_minimo: number;
  caixas_por_palete: number | null;
};

export async function salvarProduto(dados: DadosProduto) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: "Nao autenticado." };

  const tenant = await getTenant();
  if (!tenant) return { erro: "Tenant nao encontrado." };

  const payload = {
    nome: dados.nome,
    codigo: dados.codigo,
    categoria_id: dados.categoria_id,
    unidade: dados.unidade,
    preco_custo: dados.preco_custo,
    preco_venda: dados.preco_venda,
    estoque_minimo: dados.estoque_minimo,
    caixas_por_palete: dados.caixas_por_palete,
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
}

export async function excluirProduto(id: string) {
  const supabase = await createClient();
  const tenant = await getTenant();
  if (!tenant) return { erro: "Tenant nao encontrado." };

  const { error } = await supabase
    .from("produtos")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  if (error) return { erro: "Erro ao excluir produto." };

  revalidatePath("/produtos");
}

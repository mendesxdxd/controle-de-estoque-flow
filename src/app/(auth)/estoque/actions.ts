"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

type ItemNota = {
  produto_id: string;
  quantidade: number;
  observacao: string | null;
};

type DadosNota = {
  nota_fiscal: string;
  tipo: "entrada" | "saida";
  itens: ItemNota[];
};

export async function registrarNota(dados: DadosNota) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: "Nao autenticado." };

  const tenant = await getTenant();
  if (!tenant) return { erro: "Tenant nao encontrado." };

  if (tenant.nota_obrigatoria && !dados.nota_fiscal?.trim()) {
    return { erro: "Numero da nota e obrigatorio." };
  }

  if (dados.tipo === "saida") {
    for (const item of dados.itens) {
      const { data: movs } = await supabase
        .from("movimentacoes")
        .select("tipo, quantidade")
        .eq("produto_id", item.produto_id)
        .eq("tenant_id", tenant.id);

      const saldo = (movs ?? []).reduce(
        (acc, m) => (m.tipo === "entrada" ? acc + m.quantidade : acc - m.quantidade),
        0
      );

      if (item.quantidade > saldo) {
        return { erro: `Estoque insuficiente para um dos produtos. Saldo: ${saldo}.` };
      }
    }
  }

  const registros = dados.itens.map((item) => ({
    produto_id: item.produto_id,
    tipo: dados.tipo,
    quantidade: item.quantidade,
    observacao: item.observacao,
    nota_fiscal: dados.nota_fiscal,
    user_id: user.id,
    tenant_id: tenant.id,
  }));

  const { error } = await supabase.from("movimentacoes").insert(registros);
  if (error) return { erro: "Erro ao registrar movimentacao." };

  revalidatePath("/estoque");
  revalidatePath("/dashboard");
}

export async function excluirMovimentacao(id: string) {
  const supabase = await createClient();
  const tenant = await getTenant();
  if (!tenant) return { erro: "Tenant nao encontrado." };

  const { error } = await supabase
    .from("movimentacoes")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  if (error) return { erro: "Erro ao excluir movimentacao." };

  revalidatePath("/estoque");
  revalidatePath("/dashboard");
}

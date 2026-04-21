"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

type DadosMovimentacao = {
  produto_id: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  observacao: string | null;
  nota_fiscal: string;
};

export async function registrarMovimentacao(dados: DadosMovimentacao) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: "Nao autenticado." };

  const tenant = await getTenant();
  if (!tenant) return { erro: "Tenant nao encontrado." };

  if (dados.tipo === "saida") {
    const { data: movs } = await supabase
      .from("movimentacoes")
      .select("tipo, quantidade")
      .eq("produto_id", dados.produto_id)
      .eq("tenant_id", tenant.id);

    const saldo = (movs ?? []).reduce(
      (acc, m) => (m.tipo === "entrada" ? acc + m.quantidade : acc - m.quantidade),
      0
    );

    if (dados.quantidade > saldo) {
      return { erro: `Estoque insuficiente. Saldo atual: ${saldo}.` };
    }
  }

  const { error } = await supabase.from("movimentacoes").insert({
    produto_id: dados.produto_id,
    tipo: dados.tipo,
    quantidade: dados.quantidade,
    observacao: dados.observacao,
    nota_fiscal: dados.nota_fiscal,
    user_id: user.id,
    tenant_id: tenant.id,
  });

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

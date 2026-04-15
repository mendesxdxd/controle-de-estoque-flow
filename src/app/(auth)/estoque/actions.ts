"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type DadosMovimentacao = {
  produto_id: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  observacao: string | null;
};

export async function registrarMovimentacao(dados: DadosMovimentacao) {
  const supabase = await createClient();

  const { error } = await supabase.from("movimentacoes").insert({
    produto_id: dados.produto_id,
    tipo: dados.tipo,
    quantidade: dados.quantidade,
    observacao: dados.observacao,
  });

  if (error) return { erro: "Erro ao registrar movimentacao." };

  revalidatePath("/estoque");
  revalidatePath("/dashboard");
}

export async function excluirMovimentacao(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("movimentacoes").delete().eq("id", id);

  if (error) return { erro: "Erro ao excluir movimentacao." };

  revalidatePath("/estoque");
  revalidatePath("/dashboard");
}

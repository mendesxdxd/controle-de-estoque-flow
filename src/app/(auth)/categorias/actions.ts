"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type DadosCategoria = {
  id?: string;
  nome: string;
  descricao: string | null;
};

export async function salvarCategoria(dados: DadosCategoria) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: "Nao autenticado." };

  if (dados.id) {
    const { error } = await supabase
      .from("categorias")
      .update({ nome: dados.nome, descricao: dados.descricao })
      .eq("id", dados.id)
      .eq("user_id", user.id);

    if (error) return { erro: "Erro ao atualizar categoria." };
  } else {
    const { error } = await supabase
      .from("categorias")
      .insert({ nome: dados.nome, descricao: dados.descricao, user_id: user.id });

    if (error) return { erro: "Erro ao criar categoria." };
  }

  revalidatePath("/categorias");
}

export async function excluirCategoria(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: "Nao autenticado." };

  const { error } = await supabase
    .from("categorias")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { erro: "Erro ao excluir categoria." };

  revalidatePath("/categorias");
}

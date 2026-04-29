"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { redirect } from "next/navigation";

export async function concluirOnboarding(capacidadeArmazem: number | null, notaObrigatoria: boolean) {
  const tenant = await getTenant();
  if (!tenant) return { erro: "Empresa nao encontrada." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      capacidade_armazem: capacidadeArmazem,
      nota_obrigatoria: notaObrigatoria,
      onboarding_concluido: true,
    })
    .eq("id", tenant.id);

  if (error) return { erro: "Erro ao salvar configuracoes." };

  redirect("/dashboard");
}

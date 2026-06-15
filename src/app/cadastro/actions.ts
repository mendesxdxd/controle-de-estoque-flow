"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { verificarRateLimit } from "@/lib/rateLimit";

type DadosCadastro = {
  empresa: string;
  nome: string;
  email: string;
  senha: string;
  token: string;
};

export async function cadastrarEmpresa(dados: DadosCadastro) {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const permitido = await verificarRateLimit(ip, "cadastro");
  if (!permitido) return { erro: "Muitas tentativas. Aguarde um momento e tente novamente." };

  if (!dados.empresa?.trim()) return { erro: "Nome da empresa e obrigatorio." };
  if (!dados.email?.trim()) return { erro: "Email e obrigatorio." };
  if (!dados.nome?.trim()) return { erro: "Nome e obrigatorio." };
  if (!dados.senha || dados.senha.length < 8) return { erro: "Senha deve ter pelo menos 8 caracteres." };
  if (!dados.token?.trim()) return { erro: "Token de convite e obrigatorio." };

  const admin = createAdminClient();

  const { data: convite } = await admin
    .from("convites")
    .select("id, usado")
    .eq("token", dados.token)
    .single();

  if (!convite || convite.usado) {
    return { erro: "Link de convite invalido ou ja utilizado." };
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: dados.email,
    password: dados.senha,
    email_confirm: true,
    user_metadata: { nome: dados.nome },
  });

  if (authError) {
    if (authError.message.includes("already")) return { erro: "Este email ja esta cadastrado." };
    return { erro: "Erro ao criar conta. Tente novamente." };
  }

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({ nome: dados.empresa, onboarding_concluido: false })
    .select()
    .single();

  if (tenantError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { erro: "Erro ao criar empresa. Tente novamente." };
  }

  const { error: perfilError } = await admin.from("perfis").insert({
    user_id: authData.user.id,
    tenant_id: tenant.id,
    nome: dados.nome,
    role: "admin",
    pode_fechamento: true,
    nota_obrigatoria: false,
  });

  if (perfilError) {
    await admin.from("tenants").delete().eq("id", tenant.id);
    await admin.auth.admin.deleteUser(authData.user.id);
    return { erro: "Erro ao configurar conta. Tente novamente." };
  }

  await admin.from("convites").update({ usado: true }).eq("id", convite.id);

  return { sucesso: true };
}

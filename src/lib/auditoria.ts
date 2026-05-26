"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type DadosAuditoria = {
  acao: string;
  tabela?: string;
  registro_id?: string;
  detalhes?: Record<string, unknown>;
  tenant_id?: string;
};

export async function logAuditoria(dados: DadosAuditoria) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const admin = createAdminClient();
    await admin.from("audit_log").insert({
      user_id: user?.id ?? null,
      tenant_id: dados.tenant_id ?? null,
      acao: dados.acao,
      tabela: dados.tabela ?? null,
      registro_id: dados.registro_id ?? null,
      detalhes: dados.detalhes ?? null,
    });
  } catch {
    // log nunca deve quebrar o fluxo principal
  }
}
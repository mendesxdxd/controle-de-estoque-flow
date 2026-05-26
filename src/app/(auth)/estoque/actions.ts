"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { exigirRole } from "@/lib/permissoes";
import { revalidatePath } from "next/cache";
import { logAuditoria } from "@/lib/auditoria";
import { z } from "zod";

const schemaItem = z.object({
  produto_id: z.string().uuid(),
  quantidade: z.number().int().positive().max(999999),
  observacao: z.string().max(500).nullable(),
});

const schemaNota = z.object({
  nota_fiscal: z.string().max(100),
  tipo: z.enum(["entrada", "saida"]),
  transportadora: z.string().max(100).nullable(),
  itens: z.array(schemaItem).min(1).max(100),
});

type DadosNota = z.infer<typeof schemaNota>;

export async function registrarNota(dados: DadosNota) {
  try { await exigirRole("admin", "operador"); } catch { return { erro: "Sem permissao para registrar movimentacoes." }; }

  const parse = schemaNota.safeParse(dados);
  if (!parse.success) return { erro: parse.error.issues[0].message };
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
    transportadora: dados.transportadora,
    user_id: user.id,
    tenant_id: tenant.id,
  }));

  const { error } = await supabase.from("movimentacoes").insert(registros);
  if (error) return { erro: "Erro ao registrar movimentacao." };

  revalidatePath("/estoque");
  revalidatePath("/dashboard");
  return { sucesso: true };
}

export async function excluirMovimentacao(id: string) {
  try { await exigirRole("admin"); } catch { return { erro: "Sem permissao para excluir movimentacoes." }; }

  if (!z.string().uuid().safeParse(id).success) return { erro: "ID invalido." };

  const supabase = await createClient();
  const tenant = await getTenant();
  if (!tenant) return { erro: "Tenant nao encontrado." };

  const { data: mov } = await supabase
    .from("movimentacoes")
    .select("tipo, quantidade, nota_fiscal, produto_id")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .single();

  const { error } = await supabase
    .from("movimentacoes")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  if (error) return { erro: "Erro ao excluir movimentacao." };

  await logAuditoria({
    acao: "excluir_movimentacao",
    tabela: "movimentacoes",
    registro_id: id,
    tenant_id: tenant.id,
    detalhes: { tipo: mov?.tipo, quantidade: mov?.quantidade, nota_fiscal: mov?.nota_fiscal },
  });

  revalidatePath("/estoque");
  revalidatePath("/dashboard");
  return { sucesso: true };
}

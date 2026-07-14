"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { exigirRole } from "@/lib/permissoes";
import { revalidatePath } from "next/cache";
import { logAuditoria } from "@/lib/auditoria";
import { z } from "zod";

const schemaNotaInput = z
  .object({
    tipo: z.enum(["produto", "palete"]),
    numero: z.string().max(100).nullable(),
    nf_palete: z.string().max(100).nullable().optional(),
    produto_id: z.string().uuid().nullable(),
    quantidade_inicial: z.number().nonnegative().max(9999999),
    observacao: z.string().max(500).nullable(),
  })
  .refine((n) => (n.tipo === "produto" ? !!n.produto_id : n.produto_id === null), {
    message: "Nota de produto exige um produto; nota de palete nao usa produto.",
  });

const schemaEntrada = z.object({
  numero: z.string().trim().min(1).max(100),
  observacao: z.string().max(500).nullable(),
  transportadora: z.string().max(100).nullable(),
  notas: z.array(schemaNotaInput).min(1).max(50),
});

const schemaSaida = z.object({
  nota_id: z.string().uuid(),
  quantidade: z.number().positive().max(9999999),
  observacao: z.string().max(500).nullable(),
});

type DadosEntrada = z.infer<typeof schemaEntrada>;
type DadosSaida = z.infer<typeof schemaSaida>;

function mapErroRpc(msg: string): string {
  if (msg.includes("OF_OBRIGATORIA")) return "Numero da OF e obrigatorio.";
  if (msg.includes("TENANT_NAO_ENCONTRADO")) return "Tenant nao encontrado.";
  if (msg.includes("NOTA_NAO_ENCONTRADA")) return "Nota nao encontrada.";
  if (msg.includes("QUANTIDADE_INVALIDA")) return "Quantidade invalida.";
  const saldo = msg.match(/SALDO_INSUFICIENTE:([\d.]+)/);
  if (saldo) return `Saldo insuficiente. Disponivel: ${Number(saldo[1])}.`;
  return "Erro ao processar a operacao.";
}

export async function criarEntradaOF(dados: DadosEntrada) {
  try { await exigirRole("admin", "operador"); } catch { return { erro: "Sem permissao para registrar entradas." }; }

  const parse = schemaEntrada.safeParse(dados);
  if (!parse.success) return { erro: parse.error.issues[0].message };

  const supabase = await createClient();
  const tenant = await getTenant();
  if (!tenant) return { erro: "Tenant nao encontrado." };

  // Valida que os produtos referenciados pertencem ao tenant.
  const produtoIds = [...new Set(
    parse.data.notas.map((n) => n.produto_id).filter((id): id is string => !!id)
  )];
  if (produtoIds.length > 0) {
    const { data: produtos } = await supabase
      .from("produtos")
      .select("id")
      .eq("tenant_id", tenant.id)
      .in("id", produtoIds);
    const encontrados = new Set((produtos ?? []).map((p) => p.id));
    if (produtoIds.some((id) => !encontrados.has(id))) {
      return { erro: "Produto invalido para este tenant." };
    }
  }

  // Cria OF + notas + movimentacoes de entrada de forma atomica.
  const { data, error } = await supabase.rpc("of_criar_entrada", {
    p_numero: parse.data.numero,
    p_observacao: parse.data.observacao,
    p_transportadora: parse.data.transportadora,
    p_notas: parse.data.notas.map((n) => ({
      tipo: n.tipo,
      numero: n.numero,
      nf_palete: n.nf_palete ?? null,
      produto_id: n.produto_id,
      quantidade_inicial: n.quantidade_inicial,
      observacao: n.observacao,
    })),
  });

  if (error) return { erro: mapErroRpc(error.message) };

  revalidatePath("/ordens-frete");
  revalidatePath("/estoque");
  revalidatePath("/dashboard");
  return { sucesso: true, id: data as string };
}

export async function registrarSaidaNota(dados: DadosSaida) {
  try { await exigirRole("admin", "operador"); } catch { return { erro: "Sem permissao para registrar saidas." }; }

  const parse = schemaSaida.safeParse(dados);
  if (!parse.success) return { erro: parse.error.issues[0].message };

  const supabase = await createClient();

  // Valida saldo, cria a baixa e a movimentacao de saida de forma atomica.
  const { error } = await supabase.rpc("of_registrar_saida", {
    p_nota_id: parse.data.nota_id,
    p_quantidade: parse.data.quantidade,
    p_observacao: parse.data.observacao,
  });

  if (error) return { erro: mapErroRpc(error.message) };

  revalidatePath("/ordens-frete");
  revalidatePath("/estoque");
  revalidatePath("/dashboard");
  return { sucesso: true };
}

export async function estornarSaida(id: string) {
  try { await exigirRole("admin", "operador"); } catch { return { erro: "Sem permissao para estornar saidas." }; }

  if (!z.string().uuid().safeParse(id).success) return { erro: "ID invalido." };

  const supabase = await createClient();
  const tenant = await getTenant();
  if (!tenant) return { erro: "Tenant nao encontrado." };

  const { data: baixa } = await supabase
    .from("nota_baixas")
    .select("nota_id, quantidade")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .single();

  // A movimentacao de saida vinculada e removida em cascata (baixa_id).
  const { error } = await supabase
    .from("nota_baixas")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  if (error) return { erro: "Erro ao estornar a saida." };

  await logAuditoria({
    acao: "estornar_saida",
    tabela: "nota_baixas",
    registro_id: id,
    tenant_id: tenant.id,
    detalhes: { nota_id: baixa?.nota_id, quantidade: baixa?.quantidade },
  });

  revalidatePath("/ordens-frete");
  revalidatePath("/estoque");
  revalidatePath("/dashboard");
  return { sucesso: true };
}

export async function excluirOF(id: string) {
  try { await exigirRole("admin"); } catch { return { erro: "Sem permissao para excluir ordens de frete." }; }

  if (!z.string().uuid().safeParse(id).success) return { erro: "ID invalido." };

  const supabase = await createClient();
  const tenant = await getTenant();
  if (!tenant) return { erro: "Tenant nao encontrado." };

  const { data: of } = await supabase
    .from("ofs")
    .select("numero")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .single();

  // As notas e baixas sao removidas em cascata pelo banco (on delete cascade).
  const { error } = await supabase
    .from("ofs")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  if (error) return { erro: "Erro ao excluir a ordem de frete." };

  await logAuditoria({
    acao: "excluir_of",
    tabela: "ofs",
    registro_id: id,
    tenant_id: tenant.id,
    detalhes: { numero: of?.numero },
  });

  revalidatePath("/ordens-frete");
  revalidatePath("/estoque");
  revalidatePath("/dashboard");
  return { sucesso: true };
}

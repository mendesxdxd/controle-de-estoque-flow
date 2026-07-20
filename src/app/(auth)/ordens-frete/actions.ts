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

// Todo carregamento tem uma OF de saida, e ela e o que o fechamento agrupa.
// Como as duas telas que dao saida passam por estas actions, exigir aqui
// cobre os dois caminhos.
const campoOfSaida = z
  .string()
  .trim()
  .min(1, { message: "Numero da OF de saida e obrigatorio." })
  .max(100);

const schemaSaida = z.object({
  nota_id: z.string().uuid(),
  quantidade: z.number().positive().max(9999999),
  observacao: z.string().max(500).nullable(),
  of_saida: campoOfSaida,
});

const schemaSaidaMulti = z.object({
  itens: z
    .array(
      z.object({
        nota_id: z.string().uuid(),
        quantidade: z.number().positive().max(9999999),
      })
    )
    .min(1)
    .max(50),
  observacao: z.string().max(500).nullable(),
  of_saida: campoOfSaida,
});

type DadosEntrada = z.infer<typeof schemaEntrada>;
type DadosSaida = z.infer<typeof schemaSaida>;
type DadosSaidaMulti = z.infer<typeof schemaSaidaMulti>;

function mapErroRpc(msg: string): string {
  if (msg.includes("OF_OBRIGATORIA")) return "Numero da OF e obrigatorio.";
  if (msg.includes("TENANT_NAO_ENCONTRADO")) return "Tenant nao encontrado.";
  if (msg.includes("NOTA_NAO_ENCONTRADA")) return "Nota nao encontrada.";
  if (msg.includes("QUANTIDADE_INVALIDA")) return "Quantidade invalida.";
  if (msg.includes("ITENS_OBRIGATORIOS")) return "Adicione ao menos uma nota.";
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
  revalidatePath("/conferencia");
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
    p_of_saida: parse.data.of_saida,
  });

  if (error) return { erro: mapErroRpc(error.message) };

  revalidatePath("/ordens-frete");
  revalidatePath("/conferencia");
  revalidatePath("/estoque");
  revalidatePath("/dashboard");
  return { sucesso: true };
}

/**
 * Saida de uma remessa distribuida em varias notas. A RPC roda as baixas numa
 * unica transacao: se qualquer nota falhar por saldo, nenhuma e gravada.
 */
export async function registrarSaidaMultiNota(dados: DadosSaidaMulti) {
  try { await exigirRole("admin", "operador"); } catch { return { erro: "Sem permissao para registrar saidas." }; }

  const parse = schemaSaidaMulti.safeParse(dados);
  if (!parse.success) return { erro: parse.error.issues[0].message };

  const supabase = await createClient();

  const { error } = await supabase.rpc("of_registrar_saida_multi", {
    p_itens: parse.data.itens.map((i) => ({
      nota_id: i.nota_id,
      quantidade: i.quantidade,
    })),
    p_observacao: parse.data.observacao,
    p_of_saida: parse.data.of_saida,
  });

  if (error) return { erro: mapErroRpc(error.message) };

  revalidatePath("/ordens-frete");
  revalidatePath("/conferencia");
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
  revalidatePath("/conferencia");
  revalidatePath("/estoque");
  revalidatePath("/dashboard");
  return { sucesso: true };
}

/**
 * Estorna um carregamento inteiro: apaga todas as baixas que compartilham a
 * mesma OF de saida. As movimentacoes de saida saem em cascata (baixa_id) e o
 * saldo das notas volta sozinho, porque e calculado a partir das baixas.
 */
export async function estornarCarregamento(ofSaida: string) {
  try { await exigirRole("admin", "operador"); } catch { return { erro: "Sem permissao para estornar saidas." }; }

  const parse = campoOfSaida.safeParse(ofSaida);
  if (!parse.success) return { erro: "OF de saida invalida." };

  const supabase = await createClient();
  const tenant = await getTenant();
  if (!tenant) return { erro: "Tenant nao encontrado." };

  const { data: alvos } = await supabase
    .from("nota_baixas")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("of_saida", parse.data);

  if (!alvos || alvos.length === 0) return { erro: "Carregamento nao encontrado." };

  const { error } = await supabase
    .from("nota_baixas")
    .delete()
    .eq("tenant_id", tenant.id)
    .eq("of_saida", parse.data);

  if (error) return { erro: "Erro ao estornar o carregamento." };

  await logAuditoria({
    acao: "estornar_carregamento",
    tabela: "nota_baixas",
    registro_id: parse.data,
    tenant_id: tenant.id,
    detalhes: { of_saida: parse.data, baixas_estornadas: alvos.length },
  });

  revalidatePath("/conferencia");
  revalidatePath("/ordens-frete");
  revalidatePath("/conferencia");
  revalidatePath("/estoque");
  revalidatePath("/dashboard");
  return { sucesso: true, estornadas: alvos.length };
}

export async function excluirOF(id: string) {
  try { await exigirRole("admin"); } catch { return { erro: "Sem permissao para excluir ordens de frete." }; }

  if (!z.string().uuid().safeParse(id).success) return { erro: "ID invalido." };

  const supabase = await createClient();
  const tenant = await getTenant();
  if (!tenant) return { erro: "Tenant nao encontrado." };

  const { data: of } = await supabase
    .from("ofs")
    .select("numero, notas(id)")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .single();

  if (!of) return { erro: "Ordem de frete nao encontrada." };

  // O cascade (ofs -> notas -> nota_baixas -> movimentacoes) apagaria tambem as
  // saidas ja registradas nesta OF, sumindo com historico de estoque sem aviso.
  // Exigir o estorno antes torna essa perda explicita e reversivel.
  const notaIds = ((of.notas as { id: string }[] | null) ?? []).map((n) => n.id);
  if (notaIds.length > 0) {
    const { count } = await supabase
      .from("nota_baixas")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .in("nota_id", notaIds);

    if (count && count > 0) {
      return {
        erro: `Esta entrada ja teve ${count} saida(s). Estorne as saidas antes de excluir a entrada.`,
      };
    }
  }

  // As notas sao removidas em cascata pelo banco (on delete cascade).
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
  revalidatePath("/conferencia");
  revalidatePath("/estoque");
  revalidatePath("/dashboard");
  return { sucesso: true };
}

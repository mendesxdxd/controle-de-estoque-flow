import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  enviarEmailBoasVindas,
  enviarEmailPagamentoRecebido,
  enviarEmailPagamentoFalhou,
  enviarEmailContaSuspensa,
} from "@/lib/emails";

export const dynamic = "force-dynamic";

async function getNomeTenant(tenantId: string): Promise<string> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("tenants").select("nome").eq("id", tenantId).single();
    return data?.nome ?? "sua empresa";
  } catch {
    return "sua empresa";
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ erro: "Webhook nao configurado." }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ erro: "Assinatura invalida." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "customer.subscription.created": {
        const sub = event.data.object;
        const tenantId = sub.metadata?.tenant_id;
        if (!tenantId) break;
        const ativo = sub.status === "active" || sub.status === "trialing";
        await admin.from("tenants").update({ stripe_subscription_id: sub.id, ativo }).eq("id", tenantId);
        if (ativo) {
          const nome = await getNomeTenant(tenantId);
          await enviarEmailBoasVindas(tenantId, nome);
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const tenantId = sub.metadata?.tenant_id;
        if (!tenantId) break;
        const ativo = sub.status === "active" || sub.status === "trialing";
        await admin.from("tenants").update({ stripe_subscription_id: sub.id, ativo }).eq("id", tenantId);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const tenantId = sub.metadata?.tenant_id;
        if (!tenantId) break;
        await admin.from("tenants").update({ ativo: false }).eq("id", tenantId);
        const nome = await getNomeTenant(tenantId);
        await enviarEmailContaSuspensa(tenantId, nome);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as { subscription_details?: { metadata?: { tenant_id?: string } } };
        const tenantId = invoice.subscription_details?.metadata?.tenant_id;
        if (!tenantId) break;
        await admin.from("tenants").update({ ativo: false }).eq("id", tenantId);
        const nome = await getNomeTenant(tenantId);
        await enviarEmailPagamentoFalhou(tenantId, nome);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as { subscription_details?: { metadata?: { tenant_id?: string } } };
        const tenantId = invoice.subscription_details?.metadata?.tenant_id;
        if (!tenantId) break;
        await admin.from("tenants").update({ ativo: true }).eq("id", tenantId);
        const nome = await getNomeTenant(tenantId);
        await enviarEmailPagamentoRecebido(tenantId, nome);
        break;
      }
    }
  } catch {
    return NextResponse.json({ erro: "Erro interno ao processar evento." }, { status: 500 });
  }

  return NextResponse.json({ recebido: true });
}
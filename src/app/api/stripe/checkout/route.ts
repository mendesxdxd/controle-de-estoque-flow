import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { tenantId } = await req.json();
  if (!tenantId) return NextResponse.json({ erro: "tenantId obrigatorio." }, { status: 400 });

  const isAdmin = await isAdminUser();
  if (!isAdmin) return NextResponse.json({ erro: "Nao autorizado." }, { status: 403 });

  const admin = createAdminClient();
  const { data: tenant } = await admin.from("tenants").select("id, nome, stripe_customer_id").eq("id", tenantId).single();
  if (!tenant) return NextResponse.json({ erro: "Empresa nao encontrada." }, { status: 404 });

  const stripe = getStripe();
  let customerId = tenant.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: tenant.nome,
      metadata: { tenant_id: tenantId },
    });
    customerId = customer.id;
    await admin.from("tenants").update({ stripe_customer_id: customerId }).eq("id", tenantId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://flowestoque.com.br"}/admin/clientes/${tenantId}?pagamento=sucesso`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://flowestoque.com.br"}/admin/clientes/${tenantId}?pagamento=cancelado`,
    metadata: { tenant_id: tenantId },
    subscription_data: { metadata: { tenant_id: tenantId } },
  });

  return NextResponse.json({ url: session.url });
}
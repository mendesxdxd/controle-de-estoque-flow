-- Remove os restos da integracao Stripe (removida do codigo em ago/2026).
-- A tabela stripe_events estava vazia e as colunas de tenants nao eram
-- lidas em nenhum lugar do aplicativo.

drop table if exists public.stripe_events;

alter table public.tenants
  drop column if exists plano,
  drop column if exists stripe_customer_id,
  drop column if exists stripe_subscription_id;

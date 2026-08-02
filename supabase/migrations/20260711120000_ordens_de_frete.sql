-- =====================================================================
-- Ordens de Frete (OF) com notas e abatimento de saldo
-- =====================================================================
-- Este script APENAS ADICIONA estruturas novas. NAO altera nem remove
-- nenhuma tabela existente (movimentacoes, produtos, etc.).
--
-- Modelo:
--   ofs           -> uma Ordem de Frete (numero unico por tenant)
--   notas         -> notas dentro da OF (tipo 'produto' ou 'palete')
--   nota_baixas   -> historico de abatimentos (saidas/carregamentos)
--
-- Saldo de uma nota = quantidade_inicial - SUM(nota_baixas.quantidade)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Tabela: ofs
-- ---------------------------------------------------------------------
create table if not exists public.ofs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  numero      text not null,
  observacao  text,
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Numero de OF unico por tenant (evita duplicidade)
create unique index if not exists ofs_tenant_numero_uidx
  on public.ofs (tenant_id, numero);

create index if not exists ofs_tenant_created_idx
  on public.ofs (tenant_id, created_at desc);

-- ---------------------------------------------------------------------
-- 2) Tabela: notas
-- ---------------------------------------------------------------------
create table if not exists public.notas (
  id                 uuid primary key default gen_random_uuid(),
  of_id              uuid not null references public.ofs(id) on delete cascade,
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  tipo               text not null check (tipo in ('produto', 'palete')),
  numero             text,
  produto_id         uuid references public.produtos(id) on delete restrict,
  quantidade_inicial numeric not null check (quantidade_inicial >= 0),
  observacao         text,
  user_id            uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  -- nota de produto exige produto_id; nota de palete nao usa produto_id
  constraint notas_produto_check check (
    (tipo = 'produto' and produto_id is not null) or
    (tipo = 'palete'  and produto_id is null)
  )
);

create index if not exists notas_of_idx        on public.notas (of_id);
create index if not exists notas_tenant_idx     on public.notas (tenant_id);
create index if not exists notas_produto_idx    on public.notas (produto_id);

-- ---------------------------------------------------------------------
-- 3) Tabela: nota_baixas (abatimentos)
-- ---------------------------------------------------------------------
create table if not exists public.nota_baixas (
  id          uuid primary key default gen_random_uuid(),
  nota_id     uuid not null references public.notas(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  quantidade  numeric not null check (quantidade > 0),
  observacao  text,
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists nota_baixas_nota_idx   on public.nota_baixas (nota_id);
create index if not exists nota_baixas_tenant_idx  on public.nota_baixas (tenant_id);

-- =====================================================================
-- 4) Row Level Security (isolamento por tenant, via perfis)
-- =====================================================================
-- Mesmo padrao das tabelas existentes: o tenant do usuario vem de
-- perfis.tenant_id (perfis.user_id = auth.uid()).
-- A checagem de role (admin/operador) e feita na camada de server action.

alter table public.ofs         enable row level security;
alter table public.notas       enable row level security;
alter table public.nota_baixas enable row level security;

-- ofs
drop policy if exists ofs_tenant_rw on public.ofs;
create policy ofs_tenant_rw on public.ofs
  for all
  using (
    tenant_id in (select p.tenant_id from public.perfis p where p.user_id = auth.uid())
  )
  with check (
    tenant_id in (select p.tenant_id from public.perfis p where p.user_id = auth.uid())
  );

-- notas
drop policy if exists notas_tenant_rw on public.notas;
create policy notas_tenant_rw on public.notas
  for all
  using (
    tenant_id in (select p.tenant_id from public.perfis p where p.user_id = auth.uid())
  )
  with check (
    tenant_id in (select p.tenant_id from public.perfis p where p.user_id = auth.uid())
  );

-- nota_baixas
drop policy if exists nota_baixas_tenant_rw on public.nota_baixas;
create policy nota_baixas_tenant_rw on public.nota_baixas
  for all
  using (
    tenant_id in (select p.tenant_id from public.perfis p where p.user_id = auth.uid())
  )
  with check (
    tenant_id in (select p.tenant_id from public.perfis p where p.user_id = auth.uid())
  );

-- =====================================================================
-- 5) View auxiliar: saldo por nota (facilita consultas de saldo)
-- =====================================================================
create or replace view public.notas_saldo as
select
  n.id                as nota_id,
  n.of_id,
  n.tenant_id,
  n.tipo,
  n.numero,
  n.produto_id,
  n.quantidade_inicial,
  coalesce(sum(b.quantidade), 0)                          as total_baixado,
  n.quantidade_inicial - coalesce(sum(b.quantidade), 0)   as saldo,
  n.created_at
from public.notas n
left join public.nota_baixas b on b.nota_id = n.id
group by n.id;

-- A view respeita as policies RLS do usuario que consulta (Postgres 15+):
alter view public.notas_saldo set (security_invoker = on);

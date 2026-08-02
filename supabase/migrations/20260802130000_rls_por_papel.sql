-- =====================================================================
-- RLS por papel (role) — backstop de seguranca no banco
-- =====================================================================
-- Problema corrigido: as policies antigas usavam "for all" checando apenas
-- o tenant. Assim, qualquer usuario autenticado da empresa (inclusive um
-- "visualizador") conseguia INSERIR/ALTERAR/APAGAR dados falando direto com
-- o Supabase pelo navegador, pulando o exigirRole() das server actions.
--
-- Nova regra por tabela de negocio:
--   SELECT                     -> qualquer membro do tenant
--   INSERT / UPDATE / DELETE   -> apenas papel 'admin' ou 'operador'
--
-- A checagem fina (ex.: excluir produto so por admin) continua nas server
-- actions. Esta RLS e a barreira real que impede escalada de um visualizador.
--
-- Como a RPC of_criar_entrada / of_registrar_saida roda como SECURITY INVOKER,
-- as escritas dela tambem passam a respeitar estas policies (um visualizador
-- que chame a RPC direto agora recebe erro de permissao).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helpers: tenant e papel do usuario atual.
-- SECURITY DEFINER para ler public.perfis sem recursao de RLS.
-- search_path = '' + tudo qualificado com public. (superficie de ataque).
-- ---------------------------------------------------------------------
create or replace function public.auth_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select tenant_id from public.perfis where user_id = auth.uid()
$$;

create or replace function public.auth_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.perfis where user_id = auth.uid()
$$;

revoke all on function public.auth_tenant_id() from public;
revoke all on function public.auth_role() from public;
grant execute on function public.auth_tenant_id() to authenticated;
grant execute on function public.auth_role() to authenticated;

-- ---------------------------------------------------------------------
-- Aplica o novo conjunto de policies em cada tabela de negocio.
-- Remove dinamicamente qualquer policy antiga (ex.: *_tenant_rw) para nao
-- restar regra permissiva sobreposta, e recria o par leitura/escrita.
-- ---------------------------------------------------------------------
do $rls$
declare
  t   text;
  pol record;
  tabelas text[] := array[
    'produtos', 'categorias', 'movimentacoes', 'ofs', 'notas', 'nota_baixas'
  ];
begin
  foreach t in array tabelas loop
    -- remove todas as policies existentes desta tabela
    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;

    execute format('alter table public.%I enable row level security', t);

    -- leitura: qualquer membro do tenant
    execute format(
      'create policy %I on public.%I for select using (tenant_id = public.auth_tenant_id())',
      t || '_sel', t
    );

    -- insert: somente admin/operador do tenant
    execute format(
      'create policy %I on public.%I for insert with check (tenant_id = public.auth_tenant_id() and public.auth_role() in (''admin'',''operador''))',
      t || '_ins', t
    );

    -- update: somente admin/operador do tenant
    execute format(
      'create policy %I on public.%I for update using (tenant_id = public.auth_tenant_id() and public.auth_role() in (''admin'',''operador'')) with check (tenant_id = public.auth_tenant_id() and public.auth_role() in (''admin'',''operador''))',
      t || '_upd', t
    );

    -- delete: somente admin/operador do tenant
    execute format(
      'create policy %I on public.%I for delete using (tenant_id = public.auth_tenant_id() and public.auth_role() in (''admin'',''operador''))',
      t || '_del', t
    );
  end loop;
end
$rls$;

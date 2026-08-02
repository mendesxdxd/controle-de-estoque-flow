-- =====================================================================
-- Funcoes transacionais para o fluxo unificado OF <-> estoque
-- =====================================================================
-- of_criar_entrada: cria/reaproveita a OF, cria as notas e as
--   movimentacoes de entrada (para notas de produto) em UMA transacao.
-- of_registrar_saida: valida saldo, cria a baixa e a movimentacao de
--   saida (para notas de produto) em UMA transacao.
--
-- SECURITY INVOKER (padrao): as operacoes respeitam a RLS por tenant.
-- O tenant e derivado de perfis (auth.uid()), nao confiando em input.
-- =====================================================================

create or replace function public.of_criar_entrada(
  p_numero text,
  p_observacao text,
  p_transportadora text,
  p_notas jsonb
) returns uuid
language plpgsql
as $$
declare
  v_tenant  uuid;
  v_user    uuid;
  v_of      uuid;
  v_nota    jsonb;
  v_nota_id uuid;
begin
  v_user := auth.uid();
  select tenant_id into v_tenant from public.perfis where user_id = v_user;
  if v_tenant is null then
    raise exception 'TENANT_NAO_ENCONTRADO';
  end if;

  if p_numero is null or length(trim(p_numero)) = 0 then
    raise exception 'OF_OBRIGATORIA';
  end if;

  -- Reaproveita a OF se ja existir (mesmo numero no tenant); senao cria.
  select id into v_of
    from public.ofs
    where tenant_id = v_tenant and numero = trim(p_numero);

  if v_of is null then
    insert into public.ofs (tenant_id, numero, observacao, user_id)
      values (v_tenant, trim(p_numero), nullif(trim(coalesce(p_observacao, '')), ''), v_user)
      returning id into v_of;
  end if;

  for v_nota in select * from jsonb_array_elements(p_notas)
  loop
    insert into public.notas (of_id, tenant_id, tipo, numero, produto_id, quantidade_inicial, user_id)
    values (
      v_of,
      v_tenant,
      (v_nota->>'tipo'),
      nullif(trim(coalesce(v_nota->>'numero', '')), ''),
      nullif(v_nota->>'produto_id', '')::uuid,
      (v_nota->>'quantidade_inicial')::numeric,
      v_user
    )
    returning id into v_nota_id;

    if (v_nota->>'tipo') = 'produto' then
      insert into public.movimentacoes
        (produto_id, tipo, quantidade, observacao, nota_fiscal, transportadora, user_id, tenant_id, nota_id)
      values (
        (v_nota->>'produto_id')::uuid,
        'entrada',
        (v_nota->>'quantidade_inicial')::numeric,
        nullif(trim(coalesce(v_nota->>'observacao', '')), ''),
        trim(p_numero),
        nullif(trim(coalesce(p_transportadora, '')), ''),
        v_user,
        v_tenant,
        v_nota_id
      );
    end if;
  end loop;

  return v_of;
end;
$$;

create or replace function public.of_registrar_saida(
  p_nota_id uuid,
  p_quantidade numeric,
  p_observacao text
) returns uuid
language plpgsql
as $$
declare
  v_tenant    uuid;
  v_user      uuid;
  v_saldo     numeric;
  v_tipo      text;
  v_produto   uuid;
  v_of_numero text;
  v_baixa     uuid;
begin
  v_user := auth.uid();
  select tenant_id into v_tenant from public.perfis where user_id = v_user;
  if v_tenant is null then
    raise exception 'TENANT_NAO_ENCONTRADO';
  end if;

  if p_quantidade is null or p_quantidade <= 0 then
    raise exception 'QUANTIDADE_INVALIDA';
  end if;

  select
    n.tipo,
    n.produto_id,
    o.numero,
    n.quantidade_inicial - coalesce(
      (select sum(b.quantidade) from public.nota_baixas b where b.nota_id = n.id), 0
    )
  into v_tipo, v_produto, v_of_numero, v_saldo
  from public.notas n
  join public.ofs o on o.id = n.of_id
  where n.id = p_nota_id and n.tenant_id = v_tenant;

  if not found then
    raise exception 'NOTA_NAO_ENCONTRADA';
  end if;

  if p_quantidade > v_saldo then
    raise exception 'SALDO_INSUFICIENTE:%', v_saldo;
  end if;

  insert into public.nota_baixas (nota_id, tenant_id, quantidade, observacao, user_id)
    values (p_nota_id, v_tenant, p_quantidade, nullif(trim(coalesce(p_observacao, '')), ''), v_user)
    returning id into v_baixa;

  if v_tipo = 'produto' then
    insert into public.movimentacoes
      (produto_id, tipo, quantidade, observacao, nota_fiscal, user_id, tenant_id, baixa_id)
    values (
      v_produto,
      'saida',
      p_quantidade,
      nullif(trim(coalesce(p_observacao, '')), ''),
      v_of_numero,
      v_user,
      v_tenant,
      v_baixa
    );
  end if;

  return v_baixa;
end;
$$;

grant execute on function public.of_criar_entrada(text, text, text, jsonb) to authenticated;
grant execute on function public.of_registrar_saida(uuid, numeric, text) to authenticated;

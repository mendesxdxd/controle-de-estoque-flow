-- =====================================================================
-- Numero da carga na saida
-- =====================================================================
-- Uma carga agrupa as baixas de um mesmo carregamento, que pode envolver
-- varias notas e varios produtos. E o equivalente, na saida, ao que a OF
-- e na entrada.
--
-- A coluna e nullable de proposito: as saidas ja gravadas nao tem carga.
-- A obrigatoriedade e imposta na camada de action (zod), que e por onde
-- as duas telas de saida passam.
-- =====================================================================

alter table public.nota_baixas   add column if not exists carga text;
alter table public.movimentacoes add column if not exists carga text;

comment on column public.nota_baixas.carga   is 'Numero do carregamento que originou esta baixa.';
comment on column public.movimentacoes.carga is 'Numero do carregamento (apenas saidas).';

-- Busca de movimentacoes por carga nos relatorios.
create index if not exists movimentacoes_tenant_carga_idx
  on public.movimentacoes (tenant_id, carga)
  where carga is not null;

-- A multi depende da de baixo: dropar nesta ordem.
drop function if exists public.of_registrar_saida_multi(jsonb, text);
drop function if exists public.of_registrar_saida(uuid, numeric, text);

create or replace function public.of_registrar_saida(
  p_nota_id uuid,
  p_quantidade numeric,
  p_observacao text,
  p_carga text
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
  v_carga     text;
begin
  v_user := auth.uid();
  select tenant_id into v_tenant from public.perfis where user_id = v_user;
  if v_tenant is null then
    raise exception 'TENANT_NAO_ENCONTRADO';
  end if;

  if p_quantidade is null or p_quantidade <= 0 then
    raise exception 'QUANTIDADE_INVALIDA';
  end if;

  v_carga := nullif(trim(coalesce(p_carga, '')), '');

  -- Trava a nota ate o fim da transacao. Sem isso, dois operadores leem o
  -- mesmo saldo antes de qualquer baixa existir e ambos passam na validacao,
  -- furando o estoque.
  perform 1
    from public.notas
    where id = p_nota_id and tenant_id = v_tenant
    for update;

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

  insert into public.nota_baixas (nota_id, tenant_id, quantidade, observacao, user_id, carga)
    values (p_nota_id, v_tenant, p_quantidade, nullif(trim(coalesce(p_observacao, '')), ''), v_user, v_carga)
    returning id into v_baixa;

  if v_tipo = 'produto' then
    insert into public.movimentacoes
      (produto_id, tipo, quantidade, observacao, nota_fiscal, user_id, tenant_id, baixa_id, carga)
    values (
      v_produto,
      'saida',
      p_quantidade,
      nullif(trim(coalesce(p_observacao, '')), ''),
      v_of_numero,
      v_user,
      v_tenant,
      v_baixa,
      v_carga
    );
  end if;

  return v_baixa;
end;
$$;

create or replace function public.of_registrar_saida_multi(
  p_itens jsonb,
  p_observacao text,
  p_carga text
) returns setof uuid
language plpgsql
as $$
declare
  v_item jsonb;
begin
  if p_itens is null
     or jsonb_typeof(p_itens) <> 'array'
     or jsonb_array_length(p_itens) = 0 then
    raise exception 'ITENS_OBRIGATORIOS';
  end if;

  -- Travar sempre na mesma ordem (por nota_id) da a todas as transacoes a
  -- mesma sequencia de locks, evitando deadlock quando duas saidas usam as
  -- mesmas notas em ordens invertidas.
  for v_item in
    select t.item
      from jsonb_array_elements(p_itens) as t(item)
      order by (t.item->>'nota_id')
  loop
    return next public.of_registrar_saida(
      (v_item->>'nota_id')::uuid,
      (v_item->>'quantidade')::numeric,
      p_observacao,
      p_carga
    );
  end loop;
end;
$$;

grant execute on function public.of_registrar_saida(uuid, numeric, text, text) to authenticated;
grant execute on function public.of_registrar_saida_multi(jsonb, text, text) to authenticated;

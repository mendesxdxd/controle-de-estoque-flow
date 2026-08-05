-- Valor por entrada (custo por lote) — ADITIVA
alter table public.notas
  add column if not exists valor_unitario numeric not null default 0
    check (valor_unitario >= 0);

comment on column public.notas.valor_unitario is
  'Valor unitario (R$ por caixa) da carga no momento da entrada no deposito.';

create or replace function public.of_criar_entrada(
  p_numero text,
  p_observacao text,
  p_transportadora text,
  p_notas jsonb
) returns uuid
language plpgsql
set search_path to ''
as $function$
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
    insert into public.notas (of_id, tenant_id, tipo, numero, nf_palete, produto_id, quantidade_inicial, valor_unitario, user_id)
    values (
      v_of,
      v_tenant,
      (v_nota->>'tipo'),
      nullif(trim(coalesce(v_nota->>'numero', '')), ''),
      nullif(trim(coalesce(v_nota->>'nf_palete', '')), ''),
      nullif(v_nota->>'produto_id', '')::uuid,
      (v_nota->>'quantidade_inicial')::numeric,
      coalesce(nullif(v_nota->>'valor_unitario', '')::numeric, 0),
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
$function$;

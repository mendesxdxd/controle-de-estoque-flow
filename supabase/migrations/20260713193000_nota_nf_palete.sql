-- =====================================================================
-- Palete deixa de ser uma nota separada e passa a ser parte da nota
-- do produto: cada nota de produto guarda tambem a NF do palete.
-- =====================================================================
alter table public.notas
  add column if not exists nf_palete text;

-- Atualiza a funcao de entrada para gravar a NF do palete junto da nota.
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
    insert into public.notas (of_id, tenant_id, tipo, numero, nf_palete, produto_id, quantidade_inicial, user_id)
    values (
      v_of,
      v_tenant,
      (v_nota->>'tipo'),
      nullif(trim(coalesce(v_nota->>'numero', '')), ''),
      nullif(trim(coalesce(v_nota->>'nf_palete', '')), ''),
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

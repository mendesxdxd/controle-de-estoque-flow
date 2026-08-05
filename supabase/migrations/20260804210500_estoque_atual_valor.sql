-- View estoque_atual: valor por lote em vez de preco fixo do produto
drop view if exists public.estoque_atual;

create view public.estoque_atual
with (security_invoker = on)
as
select
  p.id,
  p.user_id,
  p.tenant_id,
  p.nome,
  p.codigo,
  p.unidade,
  p.estoque_minimo,
  p.caixas_por_palete,
  c.nome as categoria,
  coalesce(mov.estoque_atual, 0)::bigint as estoque_atual,
  coalesce(val.valor_estoque, 0)::numeric as valor_estoque,
  (case
     when coalesce(mov.estoque_atual, 0) > 0
       then round(coalesce(val.valor_estoque, 0) / mov.estoque_atual, 4)
     else 0
   end)::numeric as custo_medio
from public.produtos p
left join public.categorias c on c.id = p.categoria_id
left join lateral (
  select coalesce(sum(
    case when m.tipo = 'entrada' then m.quantidade else -m.quantidade end
  ), 0) as estoque_atual
  from public.movimentacoes m
  where m.produto_id = p.id
) mov on true
left join lateral (
  select coalesce(sum(
    (n.quantidade_inicial
      - coalesce((select sum(b.quantidade) from public.nota_baixas b where b.nota_id = n.id), 0)
    ) * n.valor_unitario
  ), 0) as valor_estoque
  from public.notas n
  where n.produto_id = p.id
    and n.tipo = 'produto'
) val on true
where p.tenant_id = public.get_tenant_id();

grant select on public.estoque_atual to authenticated, anon;

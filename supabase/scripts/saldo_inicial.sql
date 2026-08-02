-- =====================================================================
-- MIGRACAO DE DADOS: Saldo inicial das OFs a partir do estoque atual
-- =====================================================================
-- Objetivo: o estoque atual dos produtos veio das movimentacoes antigas
-- (entradas soltas / ajuste inicial), ANTES das Ordens de Frete. Como o
-- fluxo novo de saida so deixa carregar de uma NOTA com saldo, esse
-- estoque antigo fica "preso". Este script cria uma OF "SALDO INICIAL"
-- com uma nota por produto, com saldo = estoque atual, SEM criar
-- movimentacoes (para nao contar o estoque em dobro).
--
-- Como o saldo e calculado:
--   estoque fisico  = SUM(entradas) - SUM(saidas) de TODAS as movimentacoes
--   ja em notas     = soma dos saldos das notas de OF ja existentes
--   vai criar nota  = estoque fisico - ja em notas   (so a parte "solta")
--
-- Idempotente: rodar de novo nao duplica (o que ja virou nota nao conta).
--
-- >>> COMO USAR <<<
--   1) Rode a PARTE 1 (PREVIEW). Ela NAO altera nada. Confira os numeros
--      da coluna "estoque_atual" com a realidade do seu estoque.
--   2) So depois, se estiver tudo certo, rode a PARTE 2 (APLICAR).
-- =====================================================================


-- =====================================================================
-- PARTE 1 - PREVIEW (nao altera nada, so mostra o que seria criado)
-- =====================================================================
with estoque as (
  select
    m.tenant_id,
    m.produto_id,
    sum(case when m.tipo = 'entrada' then m.quantidade
             when m.tipo = 'saida'   then -m.quantidade
             else 0 end) as saldo_fisico
  from public.movimentacoes m
  group by m.tenant_id, m.produto_id
),
em_notas as (
  select
    n.tenant_id,
    n.produto_id,
    coalesce(sum(ns.saldo), 0) as saldo_em_notas
  from public.notas n
  join public.notas_saldo ns on ns.nota_id = n.id
  where n.tipo = 'produto'
  group by n.tenant_id, n.produto_id
)
select
  pr.nome                                                          as produto,
  pr.unidade                                                       as unidade,
  coalesce(e.saldo_fisico, 0)                                      as estoque_atual,
  coalesce(en.saldo_em_notas, 0)                                   as ja_em_notas,
  coalesce(e.saldo_fisico, 0) - coalesce(en.saldo_em_notas, 0)     as vai_criar_nota_com
from public.produtos pr
left join estoque  e  on e.tenant_id = pr.tenant_id  and e.produto_id  = pr.id
left join em_notas en on en.tenant_id = pr.tenant_id and en.produto_id = pr.id
order by pr.nome;


-- =====================================================================
-- PARTE 2 - APLICAR (cria a OF "SALDO INICIAL" e as notas)
-- ---------------------------------------------------------------------
-- Rode SOMENTE depois de conferir a PARTE 1. Tudo dentro de uma
-- transacao: se algo falhar, nada e gravado.
-- =====================================================================
begin;

-- 1) Cria a OF "SALDO INICIAL" para cada tenant que tem produtos
--    (so se ainda nao existir).
insert into public.ofs (tenant_id, numero, observacao)
select distinct pr.tenant_id, 'SALDO INICIAL', 'Saldo inicial migrado das movimentacoes antigas'
from public.produtos pr
where not exists (
  select 1 from public.ofs o
  where o.tenant_id = pr.tenant_id and o.numero = 'SALDO INICIAL'
);

-- 2) Cria uma nota por produto com a parte do estoque que ainda nao
--    esta representada em nenhuma nota de OF.
with estoque as (
  select
    m.tenant_id,
    m.produto_id,
    sum(case when m.tipo = 'entrada' then m.quantidade
             when m.tipo = 'saida'   then -m.quantidade
             else 0 end) as saldo_fisico
  from public.movimentacoes m
  group by m.tenant_id, m.produto_id
),
em_notas as (
  select
    n.tenant_id,
    n.produto_id,
    coalesce(sum(ns.saldo), 0) as saldo_em_notas
  from public.notas n
  join public.notas_saldo ns on ns.nota_id = n.id
  where n.tipo = 'produto'
  group by n.tenant_id, n.produto_id
),
a_criar as (
  select
    e.tenant_id,
    e.produto_id,
    e.saldo_fisico - coalesce(en.saldo_em_notas, 0) as qtd
  from estoque e
  left join em_notas en on en.tenant_id = e.tenant_id and en.produto_id = e.produto_id
)
insert into public.notas (of_id, tenant_id, tipo, numero, produto_id, quantidade_inicial, observacao)
select
  o.id,
  a.tenant_id,
  'produto',
  'SALDO INICIAL',
  a.produto_id,
  a.qtd,
  'Saldo inicial migrado'
from a_criar a
join public.ofs o on o.tenant_id = a.tenant_id and o.numero = 'SALDO INICIAL'
where a.qtd > 0
  and not exists (
    select 1 from public.notas n
    where n.tenant_id = a.tenant_id
      and n.produto_id = a.produto_id
      and n.numero = 'SALDO INICIAL'
  );

commit;

-- =====================================================================
-- CONFERENCIA (opcional, rode depois do commit)
-- ---------------------------------------------------------------------
-- Deve listar cada produto com o saldo disponivel para carregamento.
-- =====================================================================
-- select pr.nome, ns.saldo
-- from public.notas_saldo ns
-- join public.produtos pr on pr.id = ns.produto_id
-- join public.ofs o on o.id = ns.of_id
-- where o.numero = 'SALDO INICIAL'
-- order by pr.nome;

-- =====================================================================
-- Liga movimentacoes de estoque as notas/baixas das Ordens de Frete
-- =====================================================================
-- Aditivo: adiciona colunas nulaveis. Movimentacoes antigas ficam com
-- nota_id/baixa_id nulos e continuam funcionando normalmente.
--
-- Fluxo unificado:
--   entrada -> cria nota (produto) + movimentacao entrada (nota_id preenchido)
--   saida   -> cria nota_baixa    + movimentacao saida   (baixa_id preenchido)
--
-- on delete cascade garante que:
--   - excluir uma OF (cascata nas notas) remove as movimentacoes de entrada
--   - estornar uma baixa remove a movimentacao de saida
-- ...mantendo o estoque sempre consistente.
-- =====================================================================

alter table public.movimentacoes
  add column if not exists nota_id uuid references public.notas(id) on delete cascade;

alter table public.movimentacoes
  add column if not exists baixa_id uuid references public.nota_baixas(id) on delete cascade;

create index if not exists movimentacoes_nota_id_idx  on public.movimentacoes (nota_id);
create index if not exists movimentacoes_baixa_id_idx on public.movimentacoes (baixa_id);

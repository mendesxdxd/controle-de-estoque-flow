-- =====================================================================
-- Backfill de papeis (role) em public.perfis
-- =====================================================================
-- Contexto: o codigo passou a tratar role NULL como 'visualizador' (menor
-- privilegio). Perfis que hoje estao com role NULL dependiam do antigo
-- padrao "admin" e PERDERIAM acesso. Rode este script UMA vez para definir
-- os papeis corretos ANTES/junto de aplicar a mudanca.
--
-- Ordem segura: (1) veja quem e quem, (2) marque os admins reais,
-- (3) so entao rebaixe o restante que estiver NULL para visualizador.
-- =====================================================================

-- (1) Diagnostico: quem esta com qual papel hoje
select
  p.user_id,
  u.email,
  coalesce(p.role, '(NULL)') as papel_atual,
  t.nome as empresa
from public.perfis p
join auth.users u on u.id = p.user_id
join public.tenants t on t.id = p.tenant_id
order by t.nome, u.email;

-- (2) Defina explicitamente os ADMINS reais. Troque os emails abaixo.
--     (Repita a linha para cada admin.)
-- update public.perfis p
--   set role = 'admin'
--   from auth.users u
--   where u.id = p.user_id and u.email = 'admin@suaempresa.com';

-- (3) Opcional: quem trabalha lancando entrada/saida vira 'operador'.
-- update public.perfis p
--   set role = 'operador'
--   from auth.users u
--   where u.id = p.user_id and u.email = 'operador@suaempresa.com';

-- (4) Todo o resto que ainda estiver NULL -> visualizador (menor privilegio).
--     Rode SOMENTE depois de garantir os passos (2)/(3).
-- update public.perfis set role = 'visualizador' where role is null;

-- (5) Conferencia final (nao deve sobrar nenhum '(NULL)')
-- select coalesce(role, '(NULL)') as papel, count(*)
-- from public.perfis group by 1 order by 1;

-- =====================================================================
-- Rate limit atomico (corrige a condicao de corrida do cadastro)
-- =====================================================================
-- O rate limit antigo era feito em JS com "ler depois escrever": varios
-- pedidos simultaneos liam o mesmo contador e passavam todos. Aqui a
-- contagem vira uma unica operacao atomica no Postgres (INSERT ... ON
-- CONFLICT), imune a corrida. A janela reinicia sozinha quando expira.
--
-- Retorna TRUE se o pedido esta dentro do limite; FALSE se estourou.
-- =====================================================================

-- Garante a tabela e a unica constraint necessaria para o ON CONFLICT.
create table if not exists public.rate_limits (
  ip           text        not null,
  endpoint     text        not null,
  requests     integer     not null default 0,
  window_start timestamptz not null default now()
);

-- Remove duplicatas de (ip, endpoint) antes do indice unico (dados
-- efemeros de contador; manter uma linha por chave e seguro).
delete from public.rate_limits a
  using public.rate_limits b
  where a.ctid < b.ctid and a.ip = b.ip and a.endpoint = b.endpoint;

create unique index if not exists rate_limits_ip_endpoint_uidx
  on public.rate_limits (ip, endpoint);

create or replace function public.check_rate_limit(
  p_ip             text,
  p_endpoint       text,
  p_max            integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now   timestamptz := now();
  v_count integer;
begin
  insert into public.rate_limits (ip, endpoint, requests, window_start)
    values (p_ip, p_endpoint, 1, v_now)
  on conflict (ip, endpoint) do update
    set requests = case
          when public.rate_limits.window_start
               < v_now - make_interval(secs => p_window_seconds)
          then 1
          else public.rate_limits.requests + 1
        end,
        window_start = case
          when public.rate_limits.window_start
               < v_now - make_interval(secs => p_window_seconds)
          then v_now
          else public.rate_limits.window_start
        end
  returning requests into v_count;

  return v_count <= p_max;
end;
$$;

revoke all on function public.check_rate_limit(text, text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, text, integer, integer)
  to anon, authenticated, service_role;

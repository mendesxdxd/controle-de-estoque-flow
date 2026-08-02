-- =====================================================================
-- Fixa o search_path das funcoes de OF (correcao de seguranca)
-- =====================================================================
-- Sem search_path fixo, o valor herdado da sessao pode ser manipulado para
-- fazer a funcao resolver um objeto nao qualificado para um schema hostil.
-- O corpo destas funcoes ja qualifica tudo com "public.", entao um path
-- vazio nao muda comportamento -- apenas remove a superficie de ataque.
-- (Advisor 0011_function_search_path_mutable.)
--
-- ALTER e aditivo: nao recria o corpo das funcoes.
-- =====================================================================

alter function public.of_criar_entrada(text, text, text, jsonb)
  set search_path = '';
alter function public.of_registrar_saida(uuid, numeric, text, text)
  set search_path = '';
alter function public.of_registrar_saida_multi(jsonb, text, text)
  set search_path = '';

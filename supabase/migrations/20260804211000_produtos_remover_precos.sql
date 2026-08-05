-- DESTRUTIVA — aplicar por último, só depois de validar
alter table public.produtos drop column if exists preco_custo;
alter table public.produtos drop column if exists preco_venda;

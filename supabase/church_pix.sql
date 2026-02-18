-- PIX e contas para dízimos, ofertas e eventos

alter table churches add column if not exists pix_key text;
alter table churches add column if not exists pix_key_type text check (pix_key_type in ('cpf', 'cnpj', 'email', 'phone', 'random') or pix_key_type is null);
alter table churches add column if not exists pix_beneficiary_name text;
alter table churches add column if not exists pix_city text;

-- Valor sugerido para eventos (taxa de inscrição opcional)
alter table events add column if not exists registration_fee numeric(10,2) default null;

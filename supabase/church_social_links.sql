-- Redes sociais da igreja (Facebook, Instagram, YouTube, etc.)

alter table churches add column if not exists facebook_url text;
alter table churches add column if not exists instagram_url text;
alter table churches add column if not exists youtube_url text;
alter table churches add column if not exists twitter_url text;
alter table churches add column if not exists whatsapp text;
alter table churches add column if not exists tiktok_url text;
alter table churches add column if not exists linkedin_url text;
alter table churches add column if not exists website_url text;

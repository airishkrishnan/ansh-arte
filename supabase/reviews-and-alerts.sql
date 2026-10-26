-- Ansh Arte: customer reviews and back-in-stock alerts
-- Run this once in Supabase, after schema.sql:
-- Dashboard -> SQL Editor -> New query -> paste all of this file -> Run.
-- It is safe to run again.

-- ---------------------------------------------------------------------------
-- Reviews: customers write them on a product page, you approve them in
-- Admin -> Inbox before they show on the site.
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  city text not null default '' check (char_length(city) <= 40),
  rating int not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 1000),
  photos text[] not null default '{}' check (cardinality(photos) <= 3),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now()
);
create index if not exists reviews_product on public.reviews (product_id, status);

alter table public.reviews enable row level security;
drop policy if exists "public read approved reviews" on public.reviews;
create policy "public read approved reviews" on public.reviews for select
  using (status = 'approved' or public.is_admin());
drop policy if exists "admin write reviews" on public.reviews;
create policy "admin write reviews" on public.reviews for all
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.submit_review(
  p_product uuid,
  p_name text,
  p_city text,
  p_rating int,
  p_body text,
  p_photos text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  photo text;
begin
  if not exists (select 1 from products where id = p_product and visible) then
    raise exception 'Product not found';
  end if;
  foreach photo in array coalesce(p_photos, '{}') loop
    if photo not like '%/storage/v1/object/public/reviews/%' then
      raise exception 'Invalid photo';
    end if;
  end loop;
  insert into reviews (product_id, name, city, rating, body, photos)
  values (p_product, trim(p_name), trim(coalesce(p_city, '')), p_rating, trim(p_body), coalesce(p_photos, '{}'))
  returning id into new_id;
  return new_id;
end;
$$;
grant execute on function public.submit_review(uuid, text, text, int, text, text[]) to anon, authenticated;

-- Review photos: anyone can upload small images, only admins can delete.
-- Photos only appear on the site once you approve the review.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reviews', 'reviews', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anyone upload review photos" on storage.objects;
create policy "anyone upload review photos" on storage.objects for insert
  with check (bucket_id = 'reviews');
drop policy if exists "admin delete review photos" on storage.objects;
create policy "admin delete review photos" on storage.objects for delete
  using (bucket_id = 'reviews' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Back-in-stock alerts: shoppers leave a WhatsApp number on a sold-out piece,
-- you message them from Admin -> Inbox when it is back.
-- ---------------------------------------------------------------------------
create table if not exists public.stock_alerts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 60),
  phone text not null check (phone ~ '^[0-9]{10,12}$'),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (product_id, phone)
);

alter table public.stock_alerts enable row level security;
drop policy if exists "admin all stock alerts" on public.stock_alerts;
create policy "admin all stock alerts" on public.stock_alerts for all
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.request_stock_alert(p_product uuid, p_name text, p_phone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from products where id = p_product and visible) then
    raise exception 'Product not found';
  end if;
  insert into stock_alerts (product_id, name, phone)
  values (p_product, trim(coalesce(p_name, '')), p_phone)
  on conflict (product_id, phone) do update set name = excluded.name, notified_at = null, created_at = now();
end;
$$;
grant execute on function public.request_stock_alert(uuid, text, text) to anon, authenticated;

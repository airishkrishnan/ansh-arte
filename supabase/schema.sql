-- Ansh Arte database schema
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Then run seed.sql to load the starting categories and collections.

-- ---------------------------------------------------------------------------
-- Admins: only emails listed here can use /admin
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
-- A category with parent_id = null is a top-level category (Earrings, Rings).
-- A category with a parent is a style inside it (Hoops, Jhumkas).
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete cascade,
  name text not null,
  slug text not null,
  description text not null default '',
  image_url text,
  sort int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (parent_id, slug)
);
create unique index if not exists categories_top_slug on public.categories (slug) where parent_id is null;

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null unique,
  tagline text not null default '',
  story text not null default '',
  banner_url text,
  sort int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category_id uuid not null references public.categories(id),
  collection_id uuid references public.collections(id) on delete set null,
  material text not null check (material in ('oxidised-brass', 'german-silver')),
  price int not null check (price >= 0),
  compare_at_price int check (compare_at_price is null or compare_at_price >= 0),
  stock int not null default 1 check (stock >= 0),
  description text not null default '',
  details text not null default '',
  care text not null default '',
  images jsonb not null default '[]'::jsonb,
  visible boolean not null default true,
  featured boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category on public.products (category_id);
create index if not exists products_collection on public.products (collection_id);

-- ---------------------------------------------------------------------------
-- Store settings (one row)
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  whatsapp_number text not null default '916238714673',
  upi_id text not null default 'airishkrishnan@oksbi',
  upi_name text not null default 'Ansh Arte',
  gpay_number text not null default '7736473323',
  shipping_fee int not null default 60,
  free_shipping_above int not null default 999,
  announcement text not null default 'Handcrafted oxidised jewellery · Ships across India',
  instagram text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- Business details for the footer, contact and policy pages
alter table public.settings add column if not exists legal_name text not null default '';
alter table public.settings add column if not exists business_address text not null default '';
alter table public.settings add column if not exists support_email text not null default '';
alter table public.settings add column if not exists grievance_officer text not null default '';
alter table public.settings add column if not exists gstin text not null default '';

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('AA-' || nextval('public.order_number_seq')),
  access_key text not null default replace(gen_random_uuid()::text, '-', ''),
  customer_name text not null,
  phone text not null,
  email text not null default '',
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  notes text not null default '',
  items jsonb not null,
  subtotal int not null,
  shipping int not null,
  total int not null,
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'paid', 'packed', 'shipped', 'delivered', 'cancelled')),
  payment_ref text not null default '',
  courier text not null default '',
  tracking_number text not null default '',
  tracking_url text not null default '',
  admin_notes text not null default '',
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_status on public.orders (status, created_at desc);

-- Orders placed while signed in belong to that customer account
alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists orders_user on public.orders (user_id, created_at desc);

-- Keep updated_at fresh and log every status change
create or replace function public.touch_order()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    new.history := coalesce(old.history, '[]'::jsonb)
      || jsonb_build_object('status', new.status, 'at', now());
    -- Stock goes down once, when an order is first marked paid
    if new.status = 'paid' and old.status in ('new', 'confirmed') then
      update public.products p
         set stock = greatest(p.stock - (i ->> 'qty')::int, 0)
        from jsonb_array_elements(new.items) i
       where p.id = (i ->> 'product_id')::uuid;
    end if;
    -- Cancelling a paid order puts the pieces back in stock
    if new.status = 'cancelled' and old.status in ('paid', 'packed', 'shipped') then
      update public.products p
         set stock = p.stock + (i ->> 'qty')::int
        from jsonb_array_elements(new.items) i
       where p.id = (i ->> 'product_id')::uuid;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
for each row execute function public.touch_order();

create or replace function public.touch_product()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
for each row execute function public.touch_product();

-- Place an order. Prices and stock are read from the database, never trusted
-- from the browser. Returns the order number and its private access key.
create or replace function public.place_order(
  customer jsonb,
  cart jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  line jsonb;
  prod record;
  qty int;
  lines jsonb := '[]'::jsonb;
  sub int := 0;
  ship int;
  cfg record;
  o record;
  img text;
begin
  if jsonb_typeof(cart) <> 'array' or jsonb_array_length(cart) = 0 then
    raise exception 'Your bag is empty';
  end if;
  if jsonb_array_length(cart) > 30 then
    raise exception 'Too many items in one order';
  end if;
  if coalesce(trim(customer ->> 'name'), '') = ''
     or coalesce(customer ->> 'phone', '') !~ '^[0-9+ ]{10,15}$'
     or coalesce(trim(customer ->> 'address'), '') = ''
     or coalesce(customer ->> 'pincode', '') !~ '^[0-9]{6}$' then
    raise exception 'Please check your name, phone, address and PIN code';
  end if;

  for line in select * from jsonb_array_elements(cart) loop
    qty := greatest(least(coalesce((line ->> 'qty')::int, 1), 10), 1);
    select id, name, slug, price, stock, images, material into prod
      from products where id = (line ->> 'product_id')::uuid and visible;
    if not found then
      raise exception 'A piece in your bag is no longer available';
    end if;
    if prod.stock < qty then
      raise exception '% is sold out or has only % left', prod.name, prod.stock;
    end if;
    img := coalesce(prod.images -> 0 ->> 'thumb', prod.images -> 0 ->> 'url', '');
    lines := lines || jsonb_build_object(
      'product_id', prod.id, 'name', prod.name, 'slug', prod.slug,
      'price', prod.price, 'qty', qty, 'image', img, 'material', prod.material);
    sub := sub + prod.price * qty;
  end loop;

  select * into cfg from settings where id = 1;
  ship := case when sub >= cfg.free_shipping_above then 0 else cfg.shipping_fee end;

  insert into orders (user_id, customer_name, phone, email, address, city, state, pincode, notes,
                      items, subtotal, shipping, total, history)
  values (
    auth.uid(),
    left(trim(customer ->> 'name'), 80),
    left(trim(customer ->> 'phone'), 15),
    left(coalesce(trim(customer ->> 'email'), ''), 120),
    left(trim(customer ->> 'address'), 300),
    left(coalesce(trim(customer ->> 'city'), ''), 60),
    left(coalesce(trim(customer ->> 'state'), ''), 60),
    customer ->> 'pincode',
    left(coalesce(trim(customer ->> 'notes'), ''), 300),
    lines, sub, ship, sub + ship,
    jsonb_build_array(jsonb_build_object('status', 'new', 'at', now()))
  )
  returning number, access_key, total into o;

  return jsonb_build_object('number', o.number, 'key', o.access_key, 'total', o.total);
end;
$$;

-- Public order page: needs the order number AND its private key.
create or replace function public.get_order(order_number text, key text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'number', number, 'customer_name', customer_name, 'phone', phone,
    'address', address, 'city', city, 'state', state, 'pincode', pincode,
    'items', items, 'subtotal', subtotal, 'shipping', shipping, 'total', total,
    'status', status, 'courier', courier, 'tracking_number', tracking_number,
    'tracking_url', tracking_url, 'history', history, 'created_at', created_at)
  from orders
  where number = upper(order_number) and access_key = key;
$$;

grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;
grant execute on function public.get_order(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.settings enable row level security;
alter table public.orders enable row level security;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select using (public.is_admin());

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (visible or public.is_admin());
drop policy if exists "admin write categories" on public.categories;
create policy "admin write categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read collections" on public.collections;
create policy "public read collections" on public.collections for select using (visible or public.is_admin());
drop policy if exists "admin write collections" on public.collections;
create policy "admin write collections" on public.collections for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (visible or public.is_admin());
drop policy if exists "admin write products" on public.products;
create policy "admin write products" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings for select using (true);
drop policy if exists "admin write settings" on public.settings;
create policy "admin write settings" on public.settings for update using (public.is_admin()) with check (public.is_admin());

-- Orders are never readable by the public; only through get_order() with the key.
drop policy if exists "admin all orders" on public.orders;
create policy "admin all orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Photo storage: public bucket "products", only admins can upload
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists "admin upload products" on storage.objects;
create policy "admin upload products" on storage.objects for insert
  with check (bucket_id = 'products' and public.is_admin());
drop policy if exists "admin update products" on storage.objects;
create policy "admin update products" on storage.objects for update
  using (bucket_id = 'products' and public.is_admin());
drop policy if exists "admin delete products" on storage.objects;
create policy "admin delete products" on storage.objects for delete
  using (bucket_id = 'products' and public.is_admin());

-- Track page: find an order by its number and the phone used to place it.
create or replace function public.find_order(order_number text, phone_number text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select access_key from orders
  where number = upper(trim(order_number))
    and right(regexp_replace(phone, '[^0-9]', '', 'g'), 10)
      = right(regexp_replace(phone_number, '[^0-9]', '', 'g'), 10)
  limit 1;
$$;
grant execute on function public.find_order(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Customer accounts: profile, saved addresses, wishlist, "My orders"
-- Customers sign in with an emailed code or Google. Each customer can only
-- see and change their own rows.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '' check (length(name) <= 80),
  phone text not null default '' check (length(phone) <= 15),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  phone text not null check (phone ~ '^[0-9+ ]{10,15}$'),
  address text not null check (length(address) between 1 and 300),
  city text not null default '' check (length(city) <= 60),
  state text not null default '' check (length(state) <= 60),
  pincode text not null check (pincode ~ '^[0-9]{6}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists addresses_user on public.addresses (user_id);

create table if not exists public.wishlist (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_product();

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlist enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "admin read profiles" on public.profiles;
create policy "admin read profiles" on public.profiles for select using (public.is_admin());

drop policy if exists "own addresses" on public.addresses;
create policy "own addresses" on public.addresses for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own wishlist" on public.wishlist;
create policy "own wishlist" on public.wishlist for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- "My orders". Also picks up orders placed earlier as a guest with the same
-- email (the email is verified by sign-in, so this is safe). Returns each
-- order's private key so the account page can link to the order page.
create or replace function public.my_orders()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  mail text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if uid is null then
    return '[]'::jsonb;
  end if;
  if mail <> '' then
    update orders set user_id = uid
     where user_id is null and lower(email) = mail;
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'number', number, 'key', access_key, 'status', status, 'total', total,
      'items', items, 'courier', courier, 'tracking_number', tracking_number,
      'tracking_url', tracking_url, 'created_at', created_at)
      order by created_at desc)
    from orders where user_id = uid
  ), '[]'::jsonb);
end;
$$;
grant execute on function public.my_orders() to authenticated;

-- Lets a customer permanently delete their account. Their orders stay for the
-- shop's records but are no longer linked to the account.
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = public
as $$
  delete from auth.users where id = auth.uid() and not public.is_admin();
$$;
revoke execute on function public.delete_my_account() from anon, public;
grant execute on function public.delete_my_account() to authenticated;

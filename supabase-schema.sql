create extension if not exists pgcrypto;

create table if not exists merchant_accounts (
  id uuid primary key default gen_random_uuid(),
  account_code text unique not null,
  store_name text not null,
  contact_name text,
  phone text,
  address text,
  price_level text default 'A级代理价',
  password_hash text not null,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specification text,
  box_spec text,
  price_a numeric(12, 2) default 0,
  stock integer default 0,
  category text,
  image_url text,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  merchant_id uuid references merchant_accounts(id),
  items jsonb default '[]'::jsonb,
  total_amount numeric(12, 2) default 0,
  status text default 'preparing',
  logistics_company text,
  logistics_no text,
  operator text,
  shipped_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  reason text,
  store_info text,
  contact_name text,
  phone text,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  content text,
  target_view text default 'adminOrders',
  status text default 'pending',
  created_at timestamptz default now()
);

create index if not exists idx_orders_merchant_created on orders (merchant_id, created_at desc);
create index if not exists idx_notices_created on notices (created_at desc);

insert into merchant_accounts (account_code, store_name, contact_name, phone, address, price_level, password_hash, status)
values
  ('STORE-001', '上海静安一店', '王女士', '13800000001', '上海市静安区南京西路 188 号', 'A级代理价', encode(digest('123456', 'sha256'), 'hex'), 'active')
on conflict (account_code) do nothing;

insert into products (name, specification, box_spec, price_a, stock, category, image_url, status)
values
  ('洗润头皮养护液', '500ml', '24 瓶/箱', 68, 186, '洗护', './assets/poster-01.jpg', 'active'),
  ('首浴堂头皮发膜', '250g', '36 罐/箱', 88, 320, '头皮护理', './assets/poster-02.jpg', 'active'),
  ('川源护理乳', '1000ml', '12 瓶/箱', 126, 94, '项目耗材', './assets/poster-03.jpg', 'active')
on conflict do nothing;

insert into notices (type, title, content, target_view, status)
values
  ('系统提示', '首浴堂真实联网后台已准备', '代理申请、订单、物流、商品都会写入 Supabase 数据库。', 'adminOrders', 'done')
on conflict do nothing;

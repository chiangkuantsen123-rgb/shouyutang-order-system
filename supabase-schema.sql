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

create table if not exists material_groups (
  id text primary key,
  category text not null,
  title text not null,
  description text,
  images jsonb default '[]'::jsonb,
  status text default 'active',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_orders_merchant_created on orders (merchant_id, created_at desc);
create index if not exists idx_notices_created on notices (created_at desc);
create index if not exists idx_material_groups_updated on material_groups (updated_at desc);

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

insert into material_groups (id, category, title, description, images, status)
values
  (
    'classic',
    '品牌经典海报',
    '品牌经典海报组',
    '品牌介绍、汤法起源、汤法原理',
    '[{"title":"东方头皮汤疗的复兴","url":"./assets/poster-06.jpg"},{"title":"汤法起源","url":"./assets/poster-08.jpg"},{"title":"首浴汤法原理","url":"./assets/poster-09.jpg"}]'::jsonb,
    'active'
  ),
  (
    'classic-product',
    '品牌经典海报',
    '产品经典海报组',
    '可长期给门店下载使用',
    '[{"title":"洗润系列","url":"./assets/poster-01.jpg"},{"title":"头皮发膜","url":"./assets/poster-02.jpg"},{"title":"川源护理乳","url":"./assets/poster-03.jpg"}]'::jsonb,
    'active'
  ),
  (
    'activity-steps',
    '实时活动海报下载',
    '首浴汤法步骤活动组',
    'Step 1 到 Step 5 的活动物料',
    '[{"title":"温汤","url":"./assets/poster-10.jpg"},{"title":"微气泡","url":"./assets/poster-11.jpg"},{"title":"汤气","url":"./assets/poster-12.jpg"}]'::jsonb,
    'active'
  ),
  (
    'new-products',
    '新品上架海报',
    '新品上架海报组',
    '洗润、头皮发膜、川源护理乳',
    '[{"title":"洗润头皮养护液","url":"./assets/poster-01.jpg"},{"title":"首浴堂头皮发膜","url":"./assets/poster-02.jpg"},{"title":"川源护理乳","url":"./assets/poster-03.jpg"}]'::jsonb,
    'active'
  )
on conflict (id) do nothing;

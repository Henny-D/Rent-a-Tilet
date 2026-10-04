-- Roles
create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "See own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Profiles
create table public.profiles (
  id uuid primary key,
  full_name text not null default '',
  phone text not null default '',
  telegram text not null default '',
  city text not null default 'Addis Ababa',
  sub_city text not null default '',
  neighborhood text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- Dresses
create table public.dresses (
  id text primary key default substr(md5(random()::text), 1, 8),
  owner_id uuid,
  title text not null,
  category text not null,
  tilet text not null default 'None',
  neighborhood text not null,
  distance_km numeric not null default 2,
  fee integer not null,
  retail integer not null default 0,
  deposit integer not null default 0,
  rating numeric not null default 0,
  photos text[] not null default '{}',
  size text not null default 'M',
  bust text not null default '',
  waist text not null default '',
  hip text not null default '',
  length text not null default '',
  description text not null default '',
  blocked text[] not null default '{}',
  lender text not null default '',
  status text not null default 'review' check (status in ('review','live','rejected')),
  created_at timestamptz not null default now()
);
grant select on public.dresses to anon;
grant select, insert, update, delete on public.dresses to authenticated;
grant all on public.dresses to service_role;
alter table public.dresses enable row level security;
create policy "Anyone sees live dresses" on public.dresses for select to anon, authenticated using (status = 'live');
create policy "Owners see own dresses" on public.dresses for select to authenticated using (owner_id = auth.uid());
create policy "Admins see all dresses" on public.dresses for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Owners create dresses" on public.dresses for insert to authenticated with check (owner_id = auth.uid() and status = 'review');
create policy "Owners update dresses" on public.dresses for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Admins update dresses" on public.dresses for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Owners delete dresses" on public.dresses for delete to authenticated using (owner_id = auth.uid());

-- Only admins change approval status
create or replace function public.guard_dress() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and not public.has_role(auth.uid(), 'admin') then
    raise exception 'Only operators can change listing status';
  end if;
  return new;
end $$;
create trigger guard_dress before update on public.dresses for each row execute function public.guard_dress();

-- Bookings
create table public.bookings (
  id text primary key default substr(md5(random()::text), 1, 8),
  dress_id text not null references public.dresses(id) on delete cascade,
  renter_id uuid not null,
  lender_id uuid,
  start_date date not null,
  fee integer not null,
  deposit integer not null,
  method text not null check (method in ('Telebirr','CBE Birr')),
  pay_ref text not null default '',
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment','paid','handed_over','completed','disputed')),
  handover jsonb,
  ret jsonb,
  pay_verified boolean not null default false,
  payout_done boolean not null default false,
  refund_done boolean not null default false,
  resolution text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "Parties see bookings" on public.bookings for select to authenticated
  using (renter_id = auth.uid() or lender_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Renters create bookings" on public.bookings for insert to authenticated with check (renter_id = auth.uid());
create policy "Parties update bookings" on public.bookings for update to authenticated
  using (renter_id = auth.uid() or lender_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create or replace function public.prepare_booking() returns trigger language plpgsql security definer set search_path = public as $$
declare d public.dresses;
begin
  select * into d from public.dresses where id = new.dress_id and status = 'live';
  if not found then raise exception 'Dress is not available'; end if;
  if d.owner_id = new.renter_id then raise exception 'You cannot rent your own dress'; end if;
  new.lender_id := d.owner_id;
  new.fee := d.fee;
  new.deposit := d.deposit;
  new.pay_verified := false; new.payout_done := false; new.refund_done := false; new.resolution := null;
  new.handover := null; new.ret := null;
  new.status := case when new.pay_ref <> '' then 'paid' else 'awaiting_payment' end;
  return new;
end $$;
create trigger prepare_booking before insert on public.bookings for each row execute function public.prepare_booking();

create or replace function public.guard_booking() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.has_role(auth.uid(), 'admin') then return new; end if;
  if new.pay_verified <> old.pay_verified or new.payout_done <> old.payout_done or new.refund_done <> old.refund_done
     or new.resolution is distinct from old.resolution or new.fee <> old.fee or new.deposit <> old.deposit
     or new.renter_id <> old.renter_id or new.lender_id is distinct from old.lender_id or new.dress_id <> old.dress_id then
    raise exception 'Only operators can change payment fields';
  end if;
  if new.status <> old.status and not (
       (old.status = 'awaiting_payment' and new.status = 'paid' and auth.uid() = old.renter_id)
    or (old.status = 'paid' and new.status in ('handed_over','disputed'))
    or (old.status = 'handed_over' and new.status in ('completed','disputed'))
  ) then
    raise exception 'Invalid status change';
  end if;
  return new;
end $$;
create trigger guard_booking before update on public.bookings for each row execute function public.guard_booking();

-- Profiles policies (after bookings exists)
create policy "Own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Admins see profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Rental partners see profiles" on public.profiles for select to authenticated using (
  exists (select 1 from public.bookings b where (b.renter_id = auth.uid() and b.lender_id = profiles.id) or (b.lender_id = auth.uid() and b.renter_id = profiles.id))
);
create policy "Insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "Update own profile" on public.profiles for update to authenticated using (id = auth.uid());

-- Favorites
create table public.favorites (
  user_id uuid not null,
  dress_id text not null references public.dresses(id) on delete cascade,
  primary key (user_id, dress_id)
);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "Own favorites" on public.favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- New user: profile + first account becomes Master Admin
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, telegram, city, sub_city, neighborhood) values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'full_name', ''), 80),
    left(coalesce(new.raw_user_meta_data->>'phone', ''), 30),
    left(coalesce(new.raw_user_meta_data->>'telegram', ''), 40),
    left(coalesce(nullif(new.raw_user_meta_data->>'city', ''), 'Addis Ababa'), 60),
    left(coalesce(new.raw_user_meta_data->>'sub_city', ''), 60),
    left(coalesce(new.raw_user_meta_data->>'neighborhood', ''), 60)
  );
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Realtime sync
alter publication supabase_realtime add table public.dresses;
alter publication supabase_realtime add table public.bookings;

-- Starter dresses
insert into public.dresses (id, title, category, tilet, neighborhood, distance_km, fee, retail, deposit, rating, photos, size, bust, waist, hip, length, description, lender, status) values
('saba','Saba Gold Kemis','Habesha Kemis','Gold Menen','Bole',0.8,3000,22000,10000,4.9,'{asset:dress1}','M','88','70','96','150','Hand-woven shemma cotton with gold menen tilet. Worn once for a melse.','Meron T.','live'),
('zahra','Zahra Emerald Set','Wedding Guest','Tibeb Geometric','Kazanchis',1.2,2500,18000,8000,4.8,'{asset:dress2}','S','84','66','92','148','Emerald green with geometric gold tibeb, includes netela.','Liya A.','live'),
('liya','Liya Evening Dress','Cocktail','None','Bole',1.7,2200,14000,6000,5.0,'{asset:dress3}','M','90','72','98','110','Burgundy pleated chiffon, knee length. Perfect for evening parties.','Hiwot G.','live'),
('selam','Selam Formal Teal','Formal','Axum Cross','Sarbet',2.1,3500,26000,12000,4.7,'{asset:dress4}','L','96','78','104','152','Teal silk-cotton blend with Axum cross tilet panel.','Selam K.','live');
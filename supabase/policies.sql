-- RLS policies for shared Expo visibility and role-based edits.
-- Run this in Supabase SQL editor.

-- Tables
alter table if exists public.tables enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tables' and policyname = 'tables_select_all'
  ) then
    create policy "tables_select_all"
      on public.tables
      for select
      using (auth.uid() is not null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tables' and policyname = 'tables_insert_owner'
  ) then
    create policy "tables_insert_owner"
      on public.tables
      for insert
      with check (auth.uid() is not null and owner_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tables' and policyname = 'tables_update_owner_or_admin'
  ) then
    create policy "tables_update_owner_or_admin"
      on public.tables
      for update
      using (
        auth.uid() is not null and (
          owner_id = auth.uid()
          or exists (
            select 1
            from public.profiles p
            where p.user_id = auth.uid()
              and p.role in ('admin', 'god')
          )
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tables' and policyname = 'tables_delete_owner_or_admin'
  ) then
    create policy "tables_delete_owner_or_admin"
      on public.tables
      for delete
      using (
        auth.uid() is not null and (
          owner_id = auth.uid()
          or exists (
            select 1
            from public.profiles p
            where p.user_id = auth.uid()
              and p.role in ('admin', 'god')
          )
        )
      );
  end if;
end $$;

-- Guests
alter table if exists public.guests enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'guests' and policyname = 'guests_select_all'
  ) then
    create policy "guests_select_all"
      on public.guests
      for select
      using (auth.uid() is not null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'guests' and policyname = 'guests_insert_owner'
  ) then
    create policy "guests_insert_owner"
      on public.guests
      for insert
      with check (auth.uid() is not null and owner_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'guests' and policyname = 'guests_update_owner_or_admin'
  ) then
    create policy "guests_update_owner_or_admin"
      on public.guests
      for update
      using (
        auth.uid() is not null and (
          owner_id = auth.uid()
          or exists (
            select 1
            from public.profiles p
            where p.user_id = auth.uid()
              and p.role in ('admin', 'god')
          )
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'guests' and policyname = 'guests_delete_owner_or_admin'
  ) then
    create policy "guests_delete_owner_or_admin"
      on public.guests
      for delete
      using (
        auth.uid() is not null and (
          owner_id = auth.uid()
          or exists (
            select 1
            from public.profiles p
            where p.user_id = auth.uid()
              and p.role in ('admin', 'god')
          )
        )
      );
  end if;
end $$;

-- Orders
alter table if exists public.orders enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_select_all'
  ) then
    create policy "orders_select_all"
      on public.orders
      for select
      using (auth.uid() is not null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_insert_owner'
  ) then
    create policy "orders_insert_owner"
      on public.orders
      for insert
      with check (auth.uid() is not null and owner_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_update_owner_or_admin'
  ) then
    create policy "orders_update_owner_or_admin"
      on public.orders
      for update
      using (
        auth.uid() is not null and (
          owner_id = auth.uid()
          or exists (
            select 1
            from public.profiles p
            where p.user_id = auth.uid()
              and p.role in ('admin', 'god')
          )
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_delete_owner_or_admin'
  ) then
    create policy "orders_delete_owner_or_admin"
      on public.orders
      for delete
      using (
        auth.uid() is not null and (
          owner_id = auth.uid()
          or exists (
            select 1
            from public.profiles p
            where p.user_id = auth.uid()
              and p.role in ('admin', 'god')
          )
        )
      );
  end if;
end $$;

-- Order items
alter table if exists public.order_items enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'order_items' and policyname = 'order_items_select_all'
  ) then
    create policy "order_items_select_all"
      on public.order_items
      for select
      using (auth.uid() is not null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'order_items' and policyname = 'order_items_insert_owner'
  ) then
    create policy "order_items_insert_owner"
      on public.order_items
      for insert
      with check (auth.uid() is not null and owner_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'order_items' and policyname = 'order_items_update_owner_or_admin'
  ) then
    create policy "order_items_update_owner_or_admin"
      on public.order_items
      for update
      using (
        auth.uid() is not null and (
          owner_id = auth.uid()
          or exists (
            select 1
            from public.profiles p
            where p.user_id = auth.uid()
              and p.role in ('admin', 'god')
          )
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'order_items' and policyname = 'order_items_delete_owner_or_admin'
  ) then
    create policy "order_items_delete_owner_or_admin"
      on public.order_items
      for delete
      using (
        auth.uid() is not null and (
          owner_id = auth.uid()
          or exists (
            select 1
            from public.profiles p
            where p.user_id = auth.uid()
              and p.role in ('admin', 'god')
          )
        )
      );
  end if;
end $$;

-- Execute no SQL Editor do Supabase. Crie os usuários em Authentication > Users.
create extension if not exists pgcrypto;
create table if not exists public.vouchers (
 id uuid primary key default gen_random_uuid(),
 code text not null unique,
 customer_name text,
 first_amount numeric(12,2) not null check(first_amount>=0),
 issued_at timestamptz not null default now(),
 expires_at timestamptz not null default (now() + interval '30 days'),
 issued_by text not null,
 redeemed_at timestamptz,
 return_amount numeric(12,2) check(return_amount>=0),
 redeemed_late boolean not null default false,
 created_by uuid not null default auth.uid(),
 constraint redemption_consistent check ((redeemed_at is null and return_amount is null) or (redeemed_at is not null and return_amount is not null))
);
create index if not exists vouchers_issued_at_idx on public.vouchers(issued_at);
create index if not exists vouchers_redeemed_at_idx on public.vouchers(redeemed_at);
alter table public.vouchers enable row level security;
-- Acesso exclusivo a contas autenticadas que você criar no Supabase Auth.
create policy "authenticated read" on public.vouchers for select to authenticated using (true);
create policy "authenticated insert" on public.vouchers for insert to authenticated with check (created_by=auth.uid() and redeemed_at is null and return_amount is null);
-- Resgate atômico no servidor: bloqueia uso duplo mesmo com duas telas abertas.
create or replace function public.redeem_voucher(p_code text, p_amount numeric)
returns public.vouchers language plpgsql security definer set search_path=public as $$
declare v public.vouchers;
begin
 if auth.uid() is null then raise exception 'Acesso não autorizado'; end if;
 if p_amount is null or p_amount < 0 then raise exception 'Valor inválido'; end if;
 update public.vouchers
 set redeemed_at=now(),return_amount=p_amount,redeemed_late=(now()>expires_at)
 where code=upper(trim(p_code)) and redeemed_at is null returning * into v;
 if not found then raise exception 'Vale inexistente ou já utilizado'; end if;
 return v;
end;$$;
revoke all on function public.redeem_voucher(text,numeric) from public,anon;
grant execute on function public.redeem_voucher(text,numeric) to authenticated;

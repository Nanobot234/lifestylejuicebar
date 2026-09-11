alter table public.connect_accounts alter column platform_fee_cents set default 100;
update public.connect_accounts set platform_fee_cents = 100 where platform_fee_cents = 150;
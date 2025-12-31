begin;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'integration_tokens'
      and column_name = 'expiry_date'
  ) then
    alter table public.integration_tokens
      rename column expiry_date to expires_at;
  end if;
end $$;

alter table public.integration_tokens
  add column if not exists expires_at timestamptz;

alter table public.integration_tokens
  drop column if exists scope;

commit;

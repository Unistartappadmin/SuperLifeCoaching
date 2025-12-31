begin;

alter table public.integration_tokens
  add column if not exists token_type text not null default 'oauth';

alter table public.integration_tokens
  add constraint integration_tokens_provider_type_unique unique (provider, token_type);

commit;

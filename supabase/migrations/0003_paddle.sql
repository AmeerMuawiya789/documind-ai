-- Paddle billing support (Merchant of Record). Replaces the Stripe
-- scaffolding: adds provider-agnostic event tracking plus Paddle ids.
-- Run after 0001_init.sql / 0002_storage.sql. Safe to re-run.

-- payment_events: track provider + provider-scoped event id ---------------
alter table public.payment_events
  add column if not exists provider text not null default 'stripe',
  add column if not exists provider_event_id text;

-- Stripe rows always had an event id; Paddle rows use provider_event_id.
alter table public.payment_events
  alter column stripe_event_id drop not null;

create unique index if not exists payment_events_provider_event_uidx
  on public.payment_events (provider, provider_event_id);

-- subscriptions: Paddle customer/subscription ids --------------------------
alter table public.subscriptions
  add column if not exists provider text not null default 'stripe',
  add column if not exists paddle_customer_id text,
  add column if not exists paddle_subscription_id text;

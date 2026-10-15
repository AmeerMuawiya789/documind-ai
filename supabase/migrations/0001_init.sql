-- DocuMind AI — initial schema
-- Run with: supabase db push (or paste into the Supabase SQL editor)

-- Extensions ---------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- Helper: updated_at -------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles -----------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  tier text not null default 'free' check (tier in ('free', 'pro', 'business')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- documents ----------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'ready', 'failed')),
  page_count integer,
  char_count integer,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- document_chunks ----------------------------------------------------------
create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  page_number integer,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

-- conversations ------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- messages -----------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  -- sources: [{ chunk_id, document_id, page_number, excerpt }]
  sources jsonb,
  created_at timestamptz not null default now()
);

-- generated_outputs (summaries, extractions, comparisons) -------------------
create table public.generated_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  kind text not null check (kind in ('summary', 'extraction', 'comparison')),
  title text not null,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null,
  created_at timestamptz not null default now()
);

-- usage_events --------------------------------------------------------------
create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  operation text not null
    check (operation in ('upload', 'question', 'summary', 'extraction', 'comparison')),
  document_id uuid references public.documents (id) on delete set null,
  tokens_input integer not null default 0,
  tokens_output integer not null default 0,
  cost_usd numeric(10, 6) not null default 0,
  created_at timestamptz not null default now()
);

-- subscriptions -------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'pro', 'business')),
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- payment_events (idempotency for Stripe webhooks) ---------------------------
create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- Indexes -------------------------------------------------------------------
create index documents_user_id_created_idx on public.documents (user_id, created_at desc);
create index document_chunks_document_id_idx on public.document_chunks (document_id, chunk_index);
create index conversations_user_id_updated_idx on public.conversations (user_id, updated_at desc);
create index messages_conversation_id_created_idx on public.messages (conversation_id, created_at);
create index generated_outputs_user_id_created_idx on public.generated_outputs (user_id, created_at desc);
create index usage_events_user_id_created_idx on public.usage_events (user_id, created_at desc);
create index usage_events_user_id_operation_idx on public.usage_events (user_id, operation, created_at desc);
-- Vector similarity index (cosine distance). Build after data exists for best results.
create index document_chunks_embedding_idx
  on public.document_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Triggers -------------------------------------------------------------------
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger documents_updated_at
  before update on public.documents
  for each row execute function public.handle_updated_at();

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.handle_updated_at();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

-- Auto-create a profile + free subscription when a user signs up -------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  insert into public.subscriptions (user_id, tier, status)
  values (new.id, 'free', 'active');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Vector search (ownership enforced inside the function) ----------------------
create or replace function public.match_document_chunks(
  p_user_id uuid,
  p_document_id uuid,
  p_query_embedding vector(1536),
  p_match_count int default 8
)
returns table (
  chunk_id uuid,
  content text,
  page_number integer,
  chunk_index integer,
  similarity float
)
language plpgsql security definer set search_path = public as $$
begin
  -- Ownership check: the document must belong to the caller.
  if not exists (
    select 1 from public.documents d
    where d.id = p_document_id and d.user_id = p_user_id
  ) then
    raise exception 'document not found';
  end if;

  return query
  select
    c.id, c.content, c.page_number, c.chunk_index,
    1 - (c.embedding <=> p_query_embedding) as similarity
  from public.document_chunks c
  where c.document_id = p_document_id
    and c.embedding is not null
  order by c.embedding <=> p_query_embedding
  limit p_match_count;
end;
$$;

-- Row Level Security -----------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.generated_outputs enable row level security;
alter table public.usage_events enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;

-- profiles: users read/update only their own
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- documents
create policy "documents_select_own" on public.documents
  for select using (auth.uid() = user_id);
create policy "documents_insert_own" on public.documents
  for insert with check (auth.uid() = user_id);
create policy "documents_update_own" on public.documents
  for update using (auth.uid() = user_id);
create policy "documents_delete_own" on public.documents
  for delete using (auth.uid() = user_id);

-- document_chunks
create policy "chunks_select_own" on public.document_chunks
  for select using (auth.uid() = user_id);
create policy "chunks_insert_own" on public.document_chunks
  for insert with check (auth.uid() = user_id);
create policy "chunks_delete_own" on public.document_chunks
  for delete using (auth.uid() = user_id);

-- conversations
create policy "conversations_select_own" on public.conversations
  for select using (auth.uid() = user_id);
create policy "conversations_insert_own" on public.conversations
  for insert with check (auth.uid() = user_id);
create policy "conversations_update_own" on public.conversations
  for update using (auth.uid() = user_id);
create policy "conversations_delete_own" on public.conversations
  for delete using (auth.uid() = user_id);

-- messages
create policy "messages_select_own" on public.messages
  for select using (auth.uid() = user_id);
create policy "messages_insert_own" on public.messages
  for insert with check (auth.uid() = user_id);
create policy "messages_delete_own" on public.messages
  for delete using (auth.uid() = user_id);

-- generated_outputs
create policy "outputs_select_own" on public.generated_outputs
  for select using (auth.uid() = user_id);
create policy "outputs_insert_own" on public.generated_outputs
  for insert with check (auth.uid() = user_id);
create policy "outputs_delete_own" on public.generated_outputs
  for delete using (auth.uid() = user_id);

-- usage_events: read-only for the owner (written by server code)
create policy "usage_select_own" on public.usage_events
  for select using (auth.uid() = user_id);

-- subscriptions: read-only for the owner (written by webhooks / server)
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- payment_events: no direct user access (service role only)
-- (no policies => denied for authenticated users)

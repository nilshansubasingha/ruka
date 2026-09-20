-- RUKA production schema (Supabase / PostgreSQL 15+, pgvector).
-- STATUS: written for the production build; NOT executed in the prototype environment. Run it on a scratch project first.
create extension if not exists vector;
create extension if not exists pgcrypto;

-- ───────── helpers ─────────
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.is_admin() returns boolean language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

-- ───────── institutions & academic years (UniTo = one more row, no code change) ─────────
create table public.institutions (
  id text primary key,                       -- 'edisu', 'polito', 'unito'
  name text not null, short_name text not null, logo_url text,
  official_domains text[] not null default '{}',
  status text not null default 'planned' check (status in ('planned','beta','live')),
  theme jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.academic_years (
  id text primary key,                       -- '2026/27'
  starts_on date not null, ends_on date not null, is_current boolean not null default false
);
create unique index one_current_year on public.academic_years (is_current) where is_current;

-- ───────── official knowledge (public, admin-written; kept apart from user data) ─────────
create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  institution_id text not null references public.institutions(id),
  academic_year text not null references public.academic_years(id),
  name text not null, document_type text not null,      -- bando | scadenziario | faq | guide | regulation | notice | web_page
  authority text not null default 'primary' check (authority in ('primary','institutional_summary','community')),
  official_url text, storage_path text, publication_date date, effective_date date,
  status text not null default 'pending' check (status in ('pending','processing','indexed','failed','archived')),
  last_verified_at timestamptz, content_hash text, created_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger trg_kd_upd before update on public.knowledge_documents for each row execute function public.set_updated_at();
create index kd_inst_year on public.knowledge_documents (institution_id, academic_year, status);

create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  institution_id text not null references public.institutions(id),
  academic_year text not null references public.academic_years(id),   -- denormalised on purpose: hard filter in retrieval
  article text, section text, page int, topics text[] not null default '{}',
  student_types text[] not null default '{}',
  content text not null, language text not null default 'it',
  embedding vector(1536), token_count int, created_at timestamptz not null default now()
);
create index chunks_filter on public.document_chunks (institution_id, academic_year);
create index chunks_topics on public.document_chunks using gin (topics);
create index chunks_embedding on public.document_chunks using hnsw (embedding vector_cosine_ops);
create index chunks_fts on public.document_chunks using gin (to_tsvector('italian', content));

-- Retrieval ALWAYS filters institution + academic year first. No cross-year fallback exists.
create or replace function public.match_chunks(
  query_embedding vector(1536), p_institutions text[], p_academic_year text, p_topics text[] default '{}', match_count int default 8
) returns table (id uuid, document_id uuid, article text, page int, content text, similarity float)
language sql stable as $$
  select c.id, c.document_id, c.article, c.page, c.content, 1 - (c.embedding <=> query_embedding) as similarity
  from public.document_chunks c
  join public.knowledge_documents d on d.id = c.document_id and d.status = 'indexed'
  where c.institution_id = any (p_institutions) and c.academic_year = p_academic_year
    and (cardinality(p_topics) = 0 or c.topics && p_topics)
  order by (d.authority = 'primary') desc, c.embedding <=> query_embedding
  limit match_count
$$;

-- ───────── deterministic rules & deadlines (versioned, reviewed) ─────────
create table public.rules (
  id uuid primary key default gen_random_uuid(),
  institution_id text not null references public.institutions(id),
  academic_year text not null references public.academic_years(id),
  rule_type text not null, student_category text not null default 'all', rule_key text not null,
  value_numeric numeric, value_text text, value_date date, unit text, deadline date,
  source_chunk_id uuid references public.document_chunks(id), source_article text,
  status text not null default 'draft' check (status in ('draft','in_review','published','superseded')),
  version int not null default 1, reviewed_by uuid references auth.users(id), published_at timestamptz,
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger trg_rules_upd before update on public.rules for each row execute function public.set_updated_at();
create unique index rules_one_published on public.rules (institution_id, academic_year, rule_type, student_category, rule_key) where status = 'published';

create table public.deadlines (
  id uuid primary key default gen_random_uuid(),
  institution_id text not null references public.institutions(id),
  academic_year text not null references public.academic_years(id),
  title jsonb not null,                       -- {"en":"…","it":"…","si":"…"}
  starts_on date, due_on date not null, due_time time, tags text[] not null default '{}', applies_to text[] not null default '{all}',
  source_document_id uuid references public.knowledge_documents(id), source_article text, source_page int,
  status text not null default 'draft' check (status in ('draft','published','withdrawn')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index deadlines_lookup on public.deadlines (institution_id, academic_year, due_on) where status = 'published';

-- ───────── users (private) ─────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text, language text not null default 'en' check (language in ('en','it','si')),
  consent_profile_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.student_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  institution_id text references public.institutions(id), academic_year text references public.academic_years(id),
  degree_type text check (degree_type in ('bachelor','master','single_cycle')), course text, year_bucket text check (year_bucket in ('first','later')),
  part_time boolean, cfu int check (cfu between 0 and 400), citizenship text, family_location text, residence_type text,
  isee_value numeric, ispe_value numeric, scholarship_applied boolean, accommodation_requested boolean, accommodation_status text, ranking_status text,
  updated_at timestamptz not null default now()
);
create table public.notification_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade, category text not null,
  in_app boolean not null default false, email boolean not null default false,   -- opt-in only
  primary key (user_id, category)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null, title text not null, body text, related_deadline_id uuid references public.deadlines(id),
  read_at timestamptz, created_at timestamptz not null default now()
);
create table public.conversations (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade,   -- null = anonymous, not persisted
  title text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user','ruka')), content text, response jsonb,     -- validated structured response
  intent text, created_at timestamptz not null default now()
);
create index messages_conv on public.messages (conversation_id, created_at);

-- User-uploaded documents live in a PRIVATE bucket and a table that is separate from knowledge_documents.
create table public.uploaded_documents (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text, file_name text not null, mime_type text, size_bytes int, extracted jsonb,     -- only what the user chose to keep
  save_file boolean not null default false,                                                          -- false => only extracted summary is stored
  created_at timestamptz not null default now(), delete_after timestamptz
);
create table public.saved_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('source','message','deadline')), ref_id uuid, note text, created_at timestamptz not null default now()
);

-- ───────── feedback, review, audit, analytics ─────────
create table public.feedback_reports (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null, cited_source jsonb,
  kind text not null check (kind in ('helpful','not_helpful','incorrect')), reason text, comment text,
  status text not null default 'open' check (status in ('open','confirmed','rejected','fixed')), created_at timestamptz not null default now()
);
create table public.admin_change_reviews (
  id uuid primary key default gen_random_uuid(), source_document_id uuid references public.knowledge_documents(id),
  detected_at timestamptz not null default now(), diff_summary text, ai_summary text, affected_rules uuid[] default '{}',
  status text not null default 'pending' check (status in ('pending','approved','rejected','published')),
  reviewer uuid references auth.users(id), reviewed_at timestamptz, notify_users boolean not null default false
);
create table public.audit_log (
  id bigint generated always as identity primary key, actor uuid, action text not null, entity text not null, entity_id text, detail jsonb,
  created_at timestamptz not null default now()
);
create table public.analytics_events (   -- counters only: no question text, no personal data
  id bigint generated always as identity primary key, at timestamptz not null default now(),
  intent text, response_type text, language text, signed_in boolean, unanswered boolean, confidence text
);

-- ───────── row level security ─────────
alter table public.institutions enable row level security;   alter table public.academic_years enable row level security;
alter table public.knowledge_documents enable row level security; alter table public.document_chunks enable row level security;
alter table public.rules enable row level security;          alter table public.deadlines enable row level security;
alter table public.profiles enable row level security;       alter table public.student_profiles enable row level security;
alter table public.notification_preferences enable row level security; alter table public.notifications enable row level security;
alter table public.conversations enable row level security;  alter table public.messages enable row level security;
alter table public.uploaded_documents enable row level security; alter table public.saved_items enable row level security;
alter table public.feedback_reports enable row level security; alter table public.admin_change_reviews enable row level security;
alter table public.audit_log enable row level security;      alter table public.analytics_events enable row level security;

-- public reference data: everyone reads published/indexed rows; only admins write
create policy inst_read on public.institutions for select using (true);
create policy inst_admin on public.institutions for all using (public.is_admin()) with check (public.is_admin());
create policy ay_read on public.academic_years for select using (true);
create policy ay_admin on public.academic_years for all using (public.is_admin()) with check (public.is_admin());
create policy kd_read on public.knowledge_documents for select using (status = 'indexed' or public.is_admin());
create policy kd_admin on public.knowledge_documents for all using (public.is_admin()) with check (public.is_admin());
create policy ch_read on public.document_chunks for select using (public.is_admin() or exists (select 1 from public.knowledge_documents d where d.id = document_id and d.status = 'indexed'));
create policy ch_admin on public.document_chunks for all using (public.is_admin()) with check (public.is_admin());
create policy rules_read on public.rules for select using (status = 'published' or public.is_admin());
create policy rules_admin on public.rules for all using (public.is_admin()) with check (public.is_admin());
create policy dl_read on public.deadlines for select using (status = 'published' or public.is_admin());
create policy dl_admin on public.deadlines for all using (public.is_admin()) with check (public.is_admin());

-- private user data: owner only
create policy prof_own on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy sp_own on public.student_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy np_own on public.notification_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy n_own on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy conv_own on public.conversations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy msg_own on public.messages for all using (exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy ud_own on public.uploaded_documents for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy si_own on public.saved_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- admins never read user tables through RLS; support access goes through audited server-side functions only.

create policy fb_insert on public.feedback_reports for insert with check (user_id is null or user_id = auth.uid());
create policy fb_admin on public.feedback_reports for select using (public.is_admin());
create policy fb_admin_upd on public.feedback_reports for update using (public.is_admin());
create policy rev_admin on public.admin_change_reviews for all using (public.is_admin()) with check (public.is_admin());
create policy audit_admin on public.audit_log for select using (public.is_admin());
create policy ana_admin on public.analytics_events for select using (public.is_admin());
-- analytics inserts and audit writes happen with the service role from server routes only.

-- Storage (create in dashboard or via API): bucket "user-uploads" PRIVATE, path "{auth.uid()}/…", policy: owner read/write/delete; bucket "official-docs" admin write.

-- ───────── seed ─────────
insert into public.institutions (id, name, short_name, official_domains, status) values
  ('edisu','EDISU Piemonte','EDISU','{edisu.piemonte.it}','beta'),
  ('polito','Politecnico di Torino','PoliTO','{polito.it}','beta'),
  ('unito','Università degli Studi di Torino','UniTo','{unito.it}','planned');
insert into public.academic_years (id, starts_on, ends_on, is_current) values ('2026/27','2026-09-01','2027-10-31',true), ('2025/26','2025-09-01','2026-10-31',false);

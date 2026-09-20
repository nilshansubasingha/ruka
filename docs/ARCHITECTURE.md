# RUKA architecture

## What exists today vs. what is designed

| Layer | Prototype (in this repo, tested) | Production target (designed, not yet built here) |
|---|---|---|
| UI | Single-file app in `dist/ruka.html`, generated from `src/ui/*` | Next.js App Router + Tailwind + shadcn/ui, same components and design tokens |
| Rule engine | `src/engine/engine.js` (pure functions, 48 self-tests) | Same module, imported by server routes (port to TS, keep tests) |
| Knowledge | `src/engine/kb.js`: hand-indexed chunks with article/page/basis metadata | Ingestion worker → `document_chunks` + pgvector (`supabase/migrations/0001_init.sql`) |
| Retrieval | Topic match + hard academic-year filter | `match_chunks()` SQL function: institution + year filter first, then vector rank, primary sources first |
| Language model | None. Answers are built from rules + retrieved chunks | LLM adapter for intent detection, retrieval-query generation, multilingual explanation, document reading; structured output only |
| Accounts | Simulated on the device (demo personas, local profile) | Supabase Auth (Google, magic link) + RLS |
| Documents | Text paste / .txt; nothing leaves the browser | Private storage bucket, OCR/vision extraction, delete-on-request |
| Notifications | In-app list derived from opted-in categories | Cron worker → `notifications` + email (Resend/Postmark) |
| Admin | Read-only views + self-tests + draft-rule and review-queue demos | Role-protected `/admin` writing to the same tables, every action in `audit_log` |

## Answer pipeline

```
user text / uploaded document
  → language + intent detection            (keywords today; LLM classifier later, same intent enum)
  → context = saved profile + facts said in this conversation
  → rule engine (deterministic)            CFU maths, thresholds, ISEE route, student type, deadline states, applicability
  + retrieval (institution + academic year filtered)
  → structured answer object               schema: schemas/ruka-response.ts  (validated; invalid → error state, never rendered)
  → [optional] LLM writes only the short `summary` / `explanation` strings, in the user's language
  → fixed React/DOM components render it   (the model never emits HTML)
```

Design rules that the code enforces (and the tests check):
1. **Numbers and dates come from rules, never from the model.**
2. **Academic-year isolation:** retrieval takes a mandatory year; there is no fallback to another year. A question about a year with no indexed source returns `year_mismatch`.
3. **Every rule-based answer carries a source** with article, page, URL, `basis` (read / summary / title) and last-verified date.
4. **Unknown is a first-class result** (`no_source`, `cannot confirm`). Payment dates and later-year CFU tables are deliberately *not* answered because they are not indexed.
5. **Eligibility wording** is always "potentially eligible / appears satisfied / cannot confirm". No percentages.
6. **Two-institution questions** are split into "EDISU rule" and "PoliTO information" sections plus an interplay note.
7. **Uploaded documents:** what the document says and what the official rules say are rendered in separate blocks; an unmatched document is not explained by guessing.

## Ingestion pipeline (production)

1. Admin adds a URL or PDF → `knowledge_documents(status=pending)`.
2. Worker downloads, extracts text **per page**, detects article headings (`Art. N`, `comma`), cleans, chunks by article/comma (≈400–800 tokens, never across articles), stores `page`, `article`, `topics`, `student_types`.
3. Embeddings (1536-d) → `document_chunks.embedding`; status → `indexed`.
4. Rules and deadlines are **proposed** from chunks by an LLM but saved as `draft`; an admin reviews against the source and publishes.
5. Change detection: a nightly job re-fetches watched official URLs, hashes content, and on change creates an `admin_change_reviews` row (diff + AI summary). Nothing high-impact publishes automatically; publishing can fan out notifications to affected users.

## Target folder structure (Next.js)

```
app/
  (public)/            landing (SEO), ask, situation, deadlines, documents
  (app)/home           personalised dashboard
  admin/               sources, knowledge, rules, review, reports, analytics
  api/ask              POST: intent → engine → validated response (streaming status events)
  api/documents        POST: validate upload → extract → analyse (rate-limited)
  api/ingest           admin/worker only
components/            RukaAnswer, StatusCard, MetricCard, DeadlineCard, Timeline, CFUProgress, SourceCard,
                       ActionList, DocumentSummary, EligibilitySummary, FollowUpQuestion, UploadBox, ProfileSummary
lib/engine/            (from src/engine) rules, intents, builders
lib/llm/               provider adapter + prompts + schemas (Zod)
lib/rag/               chunking, embedding, retrieval
lib/i18n/              en / it / si dictionaries
supabase/migrations/   SQL
tests/                 unit, integration, e2e (Playwright)
```

## Technology choices

- **Next.js + Supabase + pgvector + Vercel** as specified: one Postgres for relational data, RLS and vectors keeps the MVP small.
- **LLM behind an adapter.** The spec names the OpenAI Responses API "or best available equivalent". Whatever provider is used, it must support strict structured output and document input. Pick the model at deploy time via env; the contract is `schemas/ruka-response.ts`.
- **No client-side keys.** The browser only holds the Supabase anon key; RLS does the protecting. LLM and service-role keys stay in server routes.

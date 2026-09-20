# RUKA: Resource & University Knowledge Assistant (Beta prototype)

Visual, source-backed answers about **EDISU Piemonte** and **Politecnico di Torino**, in English, Italiano and සිංහල.
Independent student project. Not affiliated with EDISU Piemonte or Politecnico di Torino.

## What this repo contains

- `dist/ruka.html`: the working product, one self-contained file. Open it in a browser or host it anywhere static.
- `src/engine/`: the rule engine, intent detection, retrieval with academic-year filtering, structured answer builders, situation analysis, document analysis, i18n, knowledge base. Pure JS, no dependencies.
- `src/ui/`: components, pages, styles. `scripts/build.mjs` inlines everything into `dist/ruka.html`.
- `netlify/functions/ruka-ai.mjs`, `netlify.toml`: the optional Mistral AI layer behind a server function. See `docs/DEPLOY-NETLIFY.md`.
- `tests/`: `engine.test.js` and `ai.test.js` (70 Node checks), `e2e.py` and `e2e_ai.py` (browser checks, Playwright).
- `supabase/migrations/0001_init.sql`, `schemas/ruka-response.ts`, `.env.example`, `docs/ARCHITECTURE.md`: the production backend design.

## Honest status

**Working and tested here:** anonymous Ask Ruka with follow-up context; visual answers (status band, key numbers, progress bar, date, next step, source card, collapsed details); Check My Situation (4-step conditional stepper → cards + prioritised actions); Deadlines (filters, personal section, cards/timeline); Documents (text analysis with document-vs-official separation, save/delete); demo accounts, profile, opt-in notification categories; language switching that re-renders whole conversations; feedback + "report incorrect information"; admin views; dark mode; mobile-first layout; keyboard/ARIA basics.

**Designed but not built or run here** (this sandbox had no network access, so Next.js, Supabase, pgvector and an LLM could not be installed or called):
- the Next.js/Supabase application, real authentication, cloud storage, email delivery;
- the live Mistral call: the AI layer is implemented and tested against a fake Mistral with the same API shape, but I could not reach the real API from the sandbox, so run a live check after deploying;
- embeddings/LLM calls, PDF/OCR ingestion, automatic change detection (the SQL, schema and pipeline are written in `supabase/` and `docs/`; the SQL has not been executed);
- WhatsApp/push notifications, calendar view.

In the prototype the "knowledge base" is a curated set of cited chunks in `kb.js`, and answers are composed by rules, not by a language model. That is deliberate: it lets the accuracy behaviour (year isolation, "cannot confirm", no invented numbers) be tested now, and the same structured contract is what an LLM would fill in production.

## Data provenance (read before showing this to students)

Facts were read on 19 Sep 2026 from the official EDISU *Bando di concorso a.a. 2026/27* (deadline table, ISEE/ISPE limits, Art. 4–8 details, amounts) and the PoliTO Architecture-master's deadline page. Each entry carries a `basis`:

| basis | meaning | shown to user as |
|---|---|---|
| `read` | wording read in the official document | "Read in the official document" |
| `summary` | reported by an institutional summary (e.g. first-year 20/11 CFU by 10 Aug 2027, from a UPO summary of the bando) | "Institutional summary: confirm in the bando" |
| `title` | only the article heading is known | "Article heading only: content not yet indexed" |

**Deliberately not answered (not indexed):** payment dates (Art. 13 c.4 / 18 c.1), the later-year CFU table (Art. 15 c.2), Art. 11 c.2 late master's enrolment, Art. 31 international deadlines, PoliTO Engineering enrolment dates. Ruka says so and points to the article.

**Please verify before launch:**
1. Page numbers are the PDF's printed page numbers; article references for `title` entries come from the bando's table of contents.
2. The paid-lodging (*alloggio a titolo oneroso*) dates (4 Nov / 19 Nov 2026, 9 Apr 2027) were read from the deadline table's column layout; the answer text already tells users to confirm in Art. 8 c.2.3.
3. PoliTO's Architecture page lists two enrolment timetables; the prototype shows both and labels them.
4. **Sinhala** is a first-draft translation and needs a native speaker's review. Italian should get a native check too.
5. A 2025/26 chunk exists only as a DEMO placeholder to prove year isolation; it is never shown.
6. Personas are fictional (`kb.js`, marked DEMO).

## Run, build, test

```bash
node scripts/build.mjs        # → dist/ruka.html (Node ≥ 20, no dependencies)
npm test                      # engine checks (node --test)
python3 tests/e2e.py          # browser checks (needs: pip install playwright && playwright install chromium)
```
Deploy the prototype: upload `dist/ruka.html` to any static host (Vercel, Netlify, GitHub Pages, or `vercel deploy dist`). It has no server, no keys and no tracking; data stays in the browser's localStorage.

## Path to production (suggested order)

1. Create Supabase project → run `supabase/migrations/0001_init.sql` on a scratch DB first → enable Auth (Google + magic link).
2. Scaffold Next.js (App Router, Tailwind, shadcn/ui); move `src/ui` components to React, keep `src/engine` as `lib/engine` and port to TypeScript with the same tests.
3. Build the ingestion worker (PDF → per-page text → article-aware chunks → embeddings) and index the bando, scadenziario, FAQs and PoliTO pages; replace `kb.js` chunks with DB rows.
4. Add `/api/ask`: intent (LLM) → engine + `match_chunks` → validate against `RukaResponse` → stream status events ("Checking EDISU rules…").
5. Add admin write paths, the change-detection job, notification worker.
6. Run the hallucination test set (see `selftest.js`) against real retrieval before opening to students.

## Security & privacy checklist

- [x] Prototype: no network calls, no keys, no third-party scripts (Google Fonts only); user data only in localStorage; delete-everything control; analytics are counters without question text.
- [x] UI renders structured data only; no model-authored HTML; response validator rejects HTML in payloads.
- [ ] Production: RLS on every table (written in migration), admin via `app_metadata.role`, service-role key server-only.
- [ ] Production: private storage bucket for uploads, MIME/size validation, virus scan, `delete_after`, no retention unless the user saves.
- [ ] Production: rate limiting on `/api/ask` and `/api/documents`; input length caps; prompt-injection handling for uploaded documents (treated as data, never as instructions).
- [ ] Production: consent record (`profiles.consent_profile_at`), account deletion cascades, privacy policy and cookie notice, DPIA (student data under GDPR).
- [ ] Production: audit log on admin actions; two-person review for high-impact rule changes.
- [ ] Production: dependency audit, CSP headers, security review before public launch.

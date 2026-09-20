# Deploy RUKA on Netlify with Mistral AI

Everything below is free. The AI layer is optional: if the function or key is missing, RUKA keeps answering with its rule engine.

## 1. Get a Mistral API key
1. Sign up at console.mistral.ai and create an API key on the free "Experiment" plan (this needs phone verification, and the plan is currently free but limited and may use prompts to improve models. Re-read Mistral's terms before launch).
2. Copy the key. Never paste it into the HTML or commit it to git.

## 2. Put the project on Netlify
**Option A (recommended): from GitHub**
1. Unzip `ruka-project.zip`, create a GitHub repo, push the contents of the `ruka/` folder to it.
2. In Netlify: *Add new site → Import an existing project* → pick the repo.
3. Netlify reads `netlify.toml` (build `node scripts/build.mjs`, publish `dist`, functions `netlify/functions`). Click Deploy.

**Option B: Netlify CLI**
```bash
npm i -g netlify-cli
cd ruka && netlify login && netlify init      # or: netlify deploy --build --prod
```
Drag-and-drop deploys of a bare `index.html` will **not** include the function, so use A or B.

## 3. Add the secret
Netlify → Site configuration → Environment variables → add:

| Name | Value | Required |
|---|---|---|
| `MISTRAL_API_KEY` | your key | yes |
| `MISTRAL_MODEL` | e.g. `mistral-small-latest` (default) | no |
| `ALLOWED_ORIGINS` | extra origins allowed to call `/api/ai` | no (same-origin always works) |

Mark the key as a secret and limit it to *Functions* scope if offered. Redeploy after adding it.

## 4. Check it works
- Open your site, ask something the rules don't cover (e.g. "Erasmus exchange semester impact?"). Ruka shows a consent notice, then an answer labelled "Written by AI from the official sources below" with a source card.
- Ask "When do I need 20 CFU?": answered by the rule engine, no AI, no consent prompt.
- Netlify → Logs → Functions shows lines like `{"ev":"ai","step":"answer","cannot":false,"ms":1400}`. Question text is never logged.

## 5. Local testing without a key or internet
```bash
npm run dev            # http://127.0.0.1:8888 with a fake Mistral (offline)
npm test               # 70 checks incl. the function against the fake
npm run test:e2e       # browser checks (needs Playwright)
# with the real key:  MISTRAL_API_KEY=... node scripts/dev.mjs
```

## What the AI can and cannot do
1. **Understand** a messy question → returns an intent + facts; RUKA's rule engine then answers deterministically.
2. **Answer from sources** if the question fits no rule: the server picks 2026/27 chunks itself (the browser cannot supply sources), Mistral answers only from them, and the answer is discarded unless (a) it cites known chunk ids, (b) every number and month in it appears in those chunks. The browser checks all of that again.
3. It never receives your profile, ISEE, documents, names, or the identifiers scrubbed from the question (emails, phones, codice fiscale, IBAN, matricola).
4. The function is same-origin only, capped at 4 KB requests and 300-character questions, and rate-limited (edge limit in `config` + a per-instance limiter).

## Known limits
- Free-tier limits and terms change. Watch for 429s: RUKA switches the AI off for a minute and keeps working.
- Sinhala answers can only be checked for digits, not month names.
- If you outgrow the free plan or need "no training on my data" for student data, switch to a paid Mistral plan; no code changes needed.
- I could not call the real Mistral API from my sandbox. All AI paths were tested against a fake with the same request/response shape (`/v1/chat/completions`, `response_format: json_object`). Do a live test after deploying, and confirm the Netlify `rateLimit` key in `config` is accepted (delete it if your plan rejects it).

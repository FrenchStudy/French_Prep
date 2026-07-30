# French Exam Prep — Plume

A static, GitHub Pages–ready site for TCF/TEF preparation: themed vocabulary with
animated two-bin review, a grammar reference with self-graded drills, and
**Plume**, an AI buddy for speaking and writing practice (with audio).

## Structure

```
prep/
├── index.html                 Dashboard
├── vocabulary.html            Two-bin vocab review (all themes or one theme)
├── grammar.html                Grammar reference + self-graded drills (no AI needed)
├── themes/
│   └── index.html              Browse all 21 themes + your mastery per theme
├── ai/
│   └── speaking_coach.html     Plume: free conversation, topic-targeted speaking
│                                with audio, writing coach, progress carnet
├── data/
│   ├── themes.json              21 themes × word lists (word, gender, gloss, example)
│   ├── writing-prompts.json     TCF/TEF writing task prompts by category
│   ├── speaking-topics.json     Free-conversation task types
│   └── grammar.json             Grammar topics, explanations, drills
└── shared/
    ├── styles.css                Design system used by every page
    ├── app.js                    Storage, API, TTS/speech-recognition helpers
    ├── config.js                 Where you paste your proxy URL (see below)
    └── worker-example.js         Ready-to-deploy Cloudflare Worker (API proxy)
```

## Deploying

1. Push this whole `prep/` folder to your GitHub repo (you already have
   `frenchstudy.github.io/prep`, so this can replace what's there).
2. Enable GitHub Pages for the repo if not already on.
3. Visit `https://frenchstudy.github.io/prep/` — vocabulary, themes, and
   grammar work immediately, no setup needed.

## Enabling Plume's AI features (5 minutes)

The AI features (conversation, grading, topic questions) need to call
Anthropic's API. **Never put your API key directly in this site's code** —
it's public, so anyone could copy it and rack up charges on your account.
Instead, use a tiny proxy that keeps the key secret:

1. Get an API key: https://console.anthropic.com/settings/keys
2. Go to https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Worker**.
3. Paste in the contents of `shared/worker-example.js`.
4. In the Worker's **Settings → Variables**, add an **encrypted** variable
   named `ANTHROPIC_API_KEY` with your key as the value.
5. Deploy. Copy the Worker's URL (something like
   `https://plume-proxy.yourname.workers.dev`).
6. Open `shared/config.js` and set:
   ```js
   const PLUME_API_ENDPOINT = "https://plume-proxy.yourname.workers.dev";
   ```
7. (Recommended) In `worker-example.js`, set `ALLOWED_ORIGIN` to your exact
   site URL (e.g. `"https://frenchstudy.github.io"`) instead of `"*"`, so
   only your site can use the key.
8. Commit and push — Plume's AI tabs will now work.

Cloudflare Workers' free tier (100,000 requests/day) is more than enough for
personal or small-class use. Any other serverless platform (Vercel, Netlify
Functions, AWS Lambda) works too — the Worker script is a good template for
any of them.

## Data model — growing your content

Everything is plain JSON, so you can extend it without touching any HTML/JS:

- **`data/themes.json`** — each theme is a key with an array of words:
  `{ "w": "la pollution", "g": "f", "en": "pollution", "ex": "example sentence" }`.
  `g` is `"m"`, `"f"`, or `""` for verbs/adjectives. Add more words to any
  theme, or add new themes — the vocab and Sujets pages pick them up
  automatically. This is currently seeded with ~10 words/theme as a working
  structure; drop in your full 7,900-word list here (grouped by theme, or
  add an "Autres" theme) whenever you're ready.
- **`data/writing-prompts.json`** — add more prompts to any category array.
- **`data/speaking-topics.json`** — add more free-conversation task types.
- **`data/grammar.json`** — add more topics/drills; `drills` currently
  supports multiple-choice (`type: "mcq"`), self-graded client-side.

## Data & privacy

All progress (vocab mastery, writing submissions, error log, speaking
history) is stored in the visitor's own browser via `localStorage` — nothing
is sent to a server except the Claude API calls needed for grading/chat
(routed through your proxy). Clearing browser data clears progress; there's
also a "Réinitialiser mes données" button in the app.

## Local testing

Opening `index.html` directly as a `file://` URL will NOT work — browsers
block `fetch()` of local JSON files for security. Instead run a tiny local
server from the `prep/` folder:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000/`.

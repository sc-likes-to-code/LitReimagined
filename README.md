# LitReimagined

> Where classics meet modern brilliance.

A reading room for public-domain classics, re-voiced in modern language and shown beside the original. Slide between the author's own words and a light, modern or contemporary retelling; tap archaic words; highlight and annotate; ask an AI quill to rewrite or explain a passage.

Built with **Next.js 16** (App Router, Cache Components), **TypeScript**, **Tailwind CSS 4**, **Supabase** (Postgres, Auth, pgvector) and the **Gemini API**.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

No keys are needed to run it. Without Supabase and Gemini keys the app runs in **demo mode**: twelve classics with sample chapters, a mock AI, and reading data saved in your browser. Add real keys later and it switches over with no code changes (see [docs/going-live.md](docs/going-live.md)).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Run, build and serve the app |
| `npm run typecheck` / `lint` / `test` | Type check, lint and unit tests |
| `npm run content:seed` | Load authors, books and collections into Supabase |
| `npm run content:ingest` | Download and split the books from Project Gutenberg (`-- --dry-run` previews offline) |
| `npm run content:translate` | Generate Light / Modern / Contemporary versions (`-- --mock`, `--levels 2`, `--book <slug>`) |
| `npm run content:glossary` | Build per-book glossaries |
| `npm run content:embed` | Create search embeddings for "find my next book" |
| `npm run content:status` | Show pipeline progress |
| `npm run content:revalidate` | Refresh the live site's cached catalogue |

## How it fits together

- `app/` routes: `(site)` pages with navigation, `(auth)` sign-in flows, `read/` the immersive reader, `api/ai/*` live AI endpoints.
- `lib/data/` the **repository layer**: pages read through one interface, backed by Supabase when configured and by bundled demo data otherwise (it also falls back if the database is empty or unreachable).
- `lib/ai/` the **AI gateway**: validation, shared cache, per-visitor and per-network daily allowances, a site-wide circuit breaker, and Gemini or demo providers.
- `lib/client/` browser-side stores for guest data and account sync.
- `scripts/` the content pipeline. `supabase/migrations/` the database schema.
- `config/` site and AI settings. Models and limits can be changed with environment variables.

## Environment

Copy `.env.example` to `.env.local`. Empty or placeholder values mean "not configured" and keep the app in demo mode.

## Content and licensing

Original texts are public domain and come from Project Gutenberg. Modern versions are AI-assisted adaptations and are labelled as such in the app.

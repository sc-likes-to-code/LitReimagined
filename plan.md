# LitReimagined: Master Plan

> **This file is the source of truth.** Read it before starting any work. Update it (status, decisions, deviations) as work progresses. If reality diverges from the plan, change the plan in the same commit and note why in the Decision Log.
>
> **Gate:** Do NOT start implementation until the owner explicitly says to begin.

---

## 0. Working Agreements (for autonomous operation)

1. **Quality bar is "premium."** When in doubt, choose the more polished, more intentional option. No template-looking UI, no default component-library aesthetics, no lorem ipsum in shipped code.
2. **Keys are placeholders until the owner supplies them.** The app must run end to end with `.env.local` absent or filled with placeholders (graceful "demo mode"), and work *perfectly with zero code changes* once real keys are pasted in. See §9.
3. **Commit after every meaningful unit of work**, with professional Conventional Commit messages (§13), and push to the GitHub repo once the owner provides it. Until then, commit locally (`git init` on first implementation step).
4. **Never commit secrets.** `.env*` is gitignored; only `.env.example` is committed.
5. **`_legacy/` is local only** (gitignored). It holds the original concept mockups, logo and old HTML/CSS. Use it for reference (logo idea, mockup content); never import from it. Logo source images live in `_legacy/assets/`.
6. **Keep this file current.** After each phase: tick the checklist (§14), add to the Decision Log (§15), and record anything the owner needs to do (§16).
7. **Verify before claiming done:** type-check, lint, build, and visually check in a browser (Playwright) for UI work, at desktop and mobile widths.
8. Prefer boring, reliable tech for the backend; spend the creativity budget on the front end.
9. Accessibility and performance are features, not afterthoughts (§12).

---

## 1. Product

**LitReimagined** is a digital reading room where classic, public-domain literature is re-voiced in modern language, shown side by side with the original text.

**Tagline:** *Where Classics Meet Modern Brilliance.* (may be refined during branding)

**Core promise:** Read the classics without the friction. The reader controls how modern the language is (a slider), can always see the original, and can ask an AI for help on any passage.

**Audience:** students, curious readers who bounced off classics, book-lovers who enjoy the originals and want a fresh lens.

**Signature feature:** the **Modernization Slider**. Text smoothly morphs between *Original → Light → Modern → Contemporary*. All levels are pre-generated, so it is instant and costs no AI quota.

---

## 2. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (latest stable, App Router), TypeScript (strict) |
| Styling | Tailwind CSS + CSS variables for theme tokens |
| Motion | GSAP (+ ScrollTrigger), Lenis smooth scroll, Framer Motion (route/UI transitions) |
| 3D | React Three Fiber + drei (hero only, lazy-loaded, with a static fallback) |
| DB / Auth / Storage | Supabase (Postgres, Auth w/ email + Google, RLS, pgvector) |
| AI | Google Gemini API, free tier (`@google/genai`) |
| Validation | Zod |
| State / data | Server Components first; TanStack Query only where client caching is needed |
| Hosting | Vercel (app) + Supabase (data) |
| Tooling | pnpm (or npm if pnpm is unavailable), ESLint, Prettier, Husky + lint-staged (optional) |
| Testing | Vitest (unit), Playwright (smoke/visual checks) |

Pin exact versions at install time and record them in the Decision Log.

---

## 3. Brand & Design System

### 3.1 Direction
**"Dark academia meets editorial gallery."** Deep ink backgrounds, warm paper-cream surfaces, restrained accents, large expressive serif typography, generous whitespace, and hand-made artsy details. It should feel like a luxury literary magazine crossed with a modern product.

### 3.2 Themes
- **Default: Ink (dark).** Near-black blue-violet ink background, cream text.
- **Toggle: Paper (light).** Warm cream paper background, ink text.
- Theme is stored in a cookie + `prefers-color-scheme` on first visit; no flash of wrong theme (set via inline script / `data-theme`).

### 3.3 Color tokens (starting values; refine by eye)
Ink: `--bg #0E0C14`, `--bg-elev #17141F`, `--surface #1E1A28`, `--text #F3EBDD`, `--text-muted #A79F92`, `--line rgba(243,235,221,.10)`
Paper: `--bg #F4ECDD`, `--bg-elev #FBF6EB`, `--surface #FFFDF7`, `--text #1B1722`, `--text-muted #6B6358`, `--line rgba(27,23,34,.12)`
Accents (both themes): **Ember** `#FF5A36` → `#FF9A3C` (gradient, from logo bookmark), **Circuit blue** `#4CC9F0` (AI/live elements), **Blush** `#E9B8A6`, **Dusty blue** `#8FA9C4`, **Sage** `#9DB39A` (supporting, from the original mockups).
Use Ember sparingly for primary actions and the bookmark motif; Circuit blue marks anything "AI/live."

### 3.4 Typography
- Display: **Fraunces** (variable, with optical size + soft/wonk axes) or Cormorant Garamond; pick by eye in phase 1 and record it.
- UI: **Inter** (or DM Sans).
- Reading text: **Newsreader** (reader view; user-adjustable size, line height, measure).
- Load via `next/font` (self-hosted, no layout shift). Fluid type scale with `clamp()`.

### 3.5 Visual language & artsy details
- Film-grain + subtle paper-texture overlay (low opacity, GPU-cheap, SVG/CSS noise).
- Hand-drawn SVG doodles (quill, fern, spheres, stars, typewriter keys) that draw themselves on scroll.
- Ink-bleed and typewriter text reveals; word-level dissolve for the slider.
- Frosted-glass nav and cards, soft layered shadows, hairline borders.
- Custom cursor (quill/bookmark) on desktop pointer devices only; disabled for touch and reduced motion.
- 3D-tilting book covers on hover; page-turn style route transitions.
- Generated cover art: books without good public-domain covers get a procedural, typographic "designed" cover (consistent premium look) rather than ugly scans.
- Optional ambient page-flip sound, **off by default**, user toggle remembered.

### 3.6 Motion rules
- Easing: a single signature curve (e.g. `cubic-bezier(.22,1,.36,1)`); durations 200–700 ms.
- Scroll-linked storytelling on Home; restraint elsewhere.
- `prefers-reduced-motion`: disable parallax/3D/cursor/morph, keep simple fades.

### 3.7 Branding refresh
- Keep the **bookmark + idea (brain/lightbulb)** concept from the original logo but redesign it as a clean, scalable **SVG** mark: a bookmark silhouette with a subtle spark/neural line forming a quill or lightbulb negative space. Ember gradient bookmark on ink; one-color variants for paper theme and favicon.
- Wordmark: "Lit**Reimagined**" set in the display serif, with *Reimagined* in italic.
- Deliverables: `logo-mark.svg`, `logo-full.svg`, mono variants, favicon set, OG image, app icons, social card template. Brand notes recorded in `docs/brand.md`.
- The original `_legacy/assets/logo2.png` is reference only.

---

## 4. Information Architecture & Pages

| Route | Purpose |
|---|---|
| `/` | Cinematic hero ("Classics, *reimagined*"), Today's Reimagining, interactive slider demo, shelves, how it works, CTA |
| `/explore` | Library grid, search, filters (era, genre, author, difficulty, modernness, length), sort, semantic search |
| `/books/[slug]` | Book detail: cover, synopsis, stats, chapter list, slider preview, Read / Save buttons, similar books |
| `/read/[slug]/[chapter]` | Reader: split or single view, slider, glossary taps, highlights, notes, bookmarks, progress, live AI tools |
| `/authors`, `/authors/[slug]` | Author index and pages: portrait, timeline, "start here" |
| `/collections`, `/collections/[slug]` | Curated lists |
| `/library` | Signed-in user shelf: reading, want to read, finished, highlights, notes, quote cards |
| `/login`, `/signup`, `/auth/callback`, `/forgot-password` | Auth |
| `/about`, `/how-it-works` | Mission + AI transparency (how translations are made, quality notes, compare examples) |
| `/privacy`, `/terms` | Legal basics |
| `not-found`, `error`, `loading` | Designed states |

Global: sticky glass nav (search, theme toggle, account), command-palette search (`⌘K`), footer, toast system, AI quota meter ("quill ink").

---

## 5. Features

### 5.1 MVP (must ship)
- Home, Explore, Book detail, Reader, Auth, Library, About/How it works.
- 12 launch books, fully ingested, with pre-generated translations at 3 levels.
- Modernization Slider (Original / Light / Modern / Contemporary) with morph animation.
- Split view (original | modern) and single view.
- Reader prefs: font size, line height, width, theme, serif/sans toggle. Persisted.
- Progress tracking, bookmarks, highlights + notes (signed-in; guest uses localStorage and merges on signup).
- Glossary tap for archaic words (pre-generated).
- Semantic + keyword search.
- Live AI features with quota system (§8).
- SEO, OG images, sitemap, robots, structured data (Book).

### 5.2 Stretch (after MVP is solid)
- Shareable quote cards (image generation via `next/og`).
- Character chat (strict daily cap).
- Reading streaks and stats.
- Compare-translations page.
- Audio read-aloud via the browser Web Speech API (free).
- PWA / offline reading of saved books.

---

## 6. Data Model (Supabase / Postgres)

Enable extensions: `pgcrypto`, `vector` (pgvector), `pg_trgm`. All tables in `public`, RLS on.

```
authors(id uuid pk, slug text unique, name, born_year, died_year, nationality,
        bio, portrait_url, created_at)

books(id uuid pk, slug text unique, title, subtitle, author_id fk,
      gutenberg_id int, original_year int, language text default 'en',
      era text, genres text[], moods text[], difficulty smallint,   -- 1..5
      word_count int, reading_minutes int,
      synopsis text, why_read text,
      cover_url text, cover_style jsonb,    -- palette/pattern for generated covers
      featured bool default false, published bool default false,
      embedding vector(768), created_at)

chapters(id uuid pk, book_id fk, idx int, title, original_text text,
         word_count int, unique(book_id, idx))

translations(id uuid pk, chapter_id fk,
             level smallint,               -- 1=light, 2=modern, 3=contemporary
             content text,                 -- paragraph-aligned with original (see below)
             model text, prompt_version text, status text, created_at,
             unique(chapter_id, level))

paragraph_map: original_text and translation content are both split into paragraph
arrays (JSON array of strings stored as jsonb) so the split view aligns 1:1.
=> chapters.original_paragraphs jsonb, translations.paragraphs jsonb.

glossary(id uuid pk, book_id fk, term text, definition text, modern_equiv text,
         unique(book_id, term))

collections(id, slug, title, description, cover_url, sort int)
collection_books(collection_id, book_id, sort)

profiles(id uuid pk = auth.users.id, display_name, avatar_url, preferences jsonb, created_at)
user_books(user_id, book_id, status text,  -- reading|want|finished
           last_chapter int, last_paragraph int, level smallint, updated_at)
bookmarks(id, user_id, book_id, chapter_idx, paragraph_idx, created_at)
highlights(id, user_id, book_id, chapter_idx, paragraph_idx, start int, end int,
           color text, note text, created_at)

ai_cache(key text pk,               -- sha256 of (feature, model, prompt_version, normalized input)
         feature text, input_hash, output jsonb, hits int, created_at)
ai_usage(id, user_id nullable, anon_id text nullable, feature text,
         day date, cost_units int, created_at)    -- for quotas
ai_global_usage(day date, feature text, count int, primary key(day, feature))
```

- **RLS:** books/authors/chapters/translations/glossary/collections are public-read (published only); user tables are owner-only; `ai_*` writes are server-only via the service role.
- Indexes: GIN on `genres`, `moods`; trigram on `title`; HNSW/IVFFlat on `books.embedding`; btree on `(book_id, idx)`.
- Migrations live in `supabase/migrations/` (SQL, timestamped). Seed in `supabase/seed.sql` and via ingestion scripts.
- Generate TS types with `supabase gen types` (or hand-maintain `types/database.ts` if CLI unavailable).

---

## 7. Content Pipeline (offline scripts, `scripts/`)

All scripts: TypeScript run with `tsx`, idempotent, resumable, log to console + `scripts/.cache/` (gitignored), respect rate limits with a queue/backoff, and **support a `--dry-run` and `--mock` mode** that works without a Gemini key (produces clearly marked placeholder text) so the pipeline can be tested end to end.

1. **`ingest-gutenberg`**: download plain text by Gutenberg ID, strip the license header/footer, detect chapters (per-book regex config in `scripts/config/books.ts`), split into paragraphs, compute word counts, upsert authors/books/chapters.
2. **`enrich-books`**: AI-generated synopsis, *why read*, moods, genre tags, difficulty, glossary candidates, short blurbs (cached, versioned).
3. **`translate`**: per chapter and level, paragraph-aligned. Chunk by paragraph groups (preserving 1:1 mapping via numbered/JSON output and a verification pass for paragraph-count match; retry or fall back on mismatch). Store `model` + `prompt_version`. Resumable via `status`.
4. **`embed`**: embeddings for books (and optionally chapter summaries) for semantic search.
5. **`covers`**: generate cover style JSON (palette, motif, typography) per book for procedural covers; fetch public-domain art when available.
6. **`seed-collections`**: curated lists.

**Free-tier realities:** the batch must throttle to the current per-minute/per-day limits (configurable in `scripts/config/limits.ts`), save progress after each unit, and be safe to re-run across days. Translate in priority order (launch books → first chapters first) so the product is demonstrable early. Provide a progress report (`pnpm content:status`).

**Launch books (12):** Pride and Prejudice, Frankenstein, Dracula, Jane Eyre, Wuthering Heights, Great Expectations, The Picture of Dorian Gray, Crime and Punishment, Moby-Dick, Alice's Adventures in Wonderland, Romeo and Juliet, The Odyssey. (Verify exact Gutenberg IDs and the best English edition/translation per book at ingest time; for translated works pick a public-domain translation and note it.)

**Fallback when the pipeline hasn't run:** include a tiny **bundled demo dataset** (`data/demo/`, 1–2 short chapters with hand-written sample levels) so the UI is fully reviewable before any key or ingestion exists.

---

## 8. AI Strategy (Gemini free tier)

### 8.1 Principles
- Pre-generate everything that can be pre-generated. Live calls only for personalized, on-demand help.
- All AI calls are **server-side** (Route Handlers / Server Actions). Key never reaches the client.
- Every live feature goes through one gateway: `lib/ai/gateway.ts`.

### 8.2 Gateway responsibilities
1. Validate input (Zod, length caps: e.g. passages ≤ ~1,200 chars).
2. Compute cache key; return cached output if present (no quota charge).
3. Check **per-user/anon daily quota** and **global daily breaker** (config-driven).
4. Call Gemini via a provider-agnostic interface `AiProvider` (`GeminiProvider`, `MockProvider`), with timeout, 1 retry w/ jitter on 429/5xx, and safe JSON parsing.
5. Store output in `ai_cache`, record usage, return `{ output, cached, remaining }`.
6. On quota exhaustion or provider failure → return a typed, friendly error the UI renders as "The quill is resting; back tomorrow" (never a crash).

### 8.3 Live features (priority order)
1. **Rewrite this passage**: styles: Plain English, Gen-Z, Poetic, Corporate, "Explain like I'm 12". Cached by passage + style.
2. **Explain this line**: short contextual explanation + literary note.
3. **Find my next book**: mood/description → semantic search over embeddings (free after embedding) + one-line AI blurbs (optional, cached).
4. *(Stretch)* **Character chat**: hard cap per day, short context, safety-filtered.

### 8.4 Quotas (all values in `config/ai.ts`, env-overridable)
- Anonymous: 3 live actions/day (tracked by signed cookie + IP hash). Signed-in: 15/day. Embeddings/"find my book" query embedding counted separately with a higher cap.
- Global breaker: stop live calls at ~85% of the configured daily ceiling.
- UI: the **Quill Ink meter** shows remaining actions; exhausted state is graceful.
- Models: cheapest Flash-Lite-class model for live; stronger Flash-class for offline batch. Model names are env-configurable (`GEMINI_MODEL_LIVE`, `GEMINI_MODEL_BATCH`, `GEMINI_MODEL_EMBED`), no hard-coded assumptions about availability. Check current model names/limits in the official docs at implementation time.

### 8.5 Demo mode
If `GEMINI_API_KEY` is missing/placeholder, `MockProvider` returns deterministic, clearly labeled sample output (`"[demo]"` badge in UI) so every flow is testable. With a real key, the provider switches automatically. No code change.

### 8.6 Prompts
Versioned in `lib/ai/prompts/` with `PROMPT_VERSION` constants (cache keys include the version). Prompts for translation must: preserve meaning, names, plot and tone; modernize diction and syntax by level; keep paragraph count identical; never add commentary; output structured JSON.

---

## 9. Environment & Placeholder Strategy

Provide `.env.example` (committed) and a typed env loader `lib/env.ts` (Zod) that:
- Distinguishes **public** (`NEXT_PUBLIC_*`) vs **server** vars.
- Treats empty or placeholder values (e.g. `your-key-here`, `placeholder`) as "not configured."
- Exposes feature flags: `isSupabaseConfigured`, `isGeminiConfigured`.

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
GEMINI_API_KEY=your-gemini-key-here
GEMINI_MODEL_LIVE=
GEMINI_MODEL_BATCH=
GEMINI_MODEL_EMBED=
AI_DAILY_LIMIT_ANON=3
AI_DAILY_LIMIT_USER=15
AI_GLOBAL_DAILY_CEILING=
```

**Degradation matrix (must all work, no crashes):**
| State | Behavior |
|---|---|
| No Supabase | Site runs on the bundled demo dataset (read-only); auth UI shows "Connect Supabase to enable accounts" notice; guest features use localStorage |
| Supabase, no Gemini | Full site; pre-generated content served; live AI shows demo-mode output or a "not configured" notice |
| Both configured | Everything live |

**Switch-over checklist** is kept in `docs/going-live.md` (create project → run migrations → set env → run ingest/translate scripts → configure Google OAuth → deploy). It must be accurate and tested against the demo/mock paths.

---

## 10. Reader Details (the heart of the product)

- Paragraph-aligned rendering from `original_paragraphs` + `translations.paragraphs[level]`.
- **Slider levels:** 0 Original, 1 Light, 2 Modern, 3 Contemporary. Changing level cross-fades/morphs paragraph by paragraph (word-diff-based dissolve where feasible; graceful crossfade fallback).
- **Views:** Single (focused) and Split (original left, modern right, scroll-synced by paragraph).
- Glossary underline on archaic terms → popover (definition + modern equivalent).
- Selection toolbar: highlight (colors), note, bookmark, *Rewrite*, *Explain* (live AI with quota meter), copy quote.
- Progress: reading position saved (debounced); resume on return; chapter navigation with keyboard shortcuts.
- Prefs panel: font family, size, line-height, measure, theme, focus mode (dims other paragraphs).
- Long-chapter performance: virtualize or content-visibility, no layout shift.

---

## 11. Project Structure

```
/
├─ plan.md
├─ README.md
├─ .env.example
├─ package.json / tsconfig.json / next.config.ts / tailwind config
├─ app/
│  ├─ (marketing)/  page.tsx, about/, how-it-works/ ...
│  ├─ (app)/        explore/, books/[slug]/, authors/, collections/, library/
│  ├─ read/[slug]/[chapter]/
│  ├─ (auth)/       login/, signup/, forgot-password/, auth/callback/
│  ├─ api/          ai/rewrite, ai/explain, ai/recommend, search, ...
│  ├─ layout.tsx, globals.css, not-found.tsx, error.tsx, sitemap.ts, robots.ts
├─ components/
│  ├─ ui/ (buttons, inputs, dialogs, toasts, tooltip, tabs, sliders)
│  ├─ brand/ (Logo, Wordmark, doodles)
│  ├─ home/, explore/, book/, reader/, auth/, ai/
│  ├─ motion/ (Reveal, SplitText, Magnetic, Cursor, PageTransition)
│  └─ three/ (HeroCovers)
├─ lib/
│  ├─ env.ts, utils.ts
│  ├─ supabase/ (browser, server, middleware, admin clients)
│  ├─ data/ (repository layer: Supabase impl + demo impl behind one interface)
│  ├─ ai/ (gateway, providers, prompts, quota, cache)
│  └─ search/
├─ config/ (ai.ts, site.ts, books.ts)
├─ data/demo/
├─ supabase/ (migrations/, seed.sql, config.toml)
├─ scripts/ (ingest, enrich, translate, embed, covers, config/)
├─ public/ (brand/, fonts if needed, textures/)
├─ docs/ (brand.md, going-live.md, architecture.md)
└─ tests/
```

**Repository pattern:** all data access goes through `lib/data/*` interfaces with two implementations (Supabase, demo JSON). Pages never talk to Supabase directly. This is what makes the no-keys → keys switch seamless.

---

## 12. Quality Bar

- **Performance:** Lighthouse ≥ 90 on Home/Explore/Book (mobile). Hero 3D lazy-loaded after first paint with a static poster fallback; images via `next/image` (AVIF/WebP); fonts via `next/font`; minimal client JS (RSC first); `content-visibility` for long text.
- **Accessibility:** WCAG 2.2 AA contrast in both themes, full keyboard navigation, visible focus rings, ARIA for custom controls (slider, popovers, command palette), reduced-motion support, screen-reader-friendly reader (semantic headings/paragraphs, no animation-only content), skip links.
- **Responsive:** designed mobile-first; verify at 375, 768, 1280, 1536 px.
- **SEO:** metadata API, OG images, JSON-LD (`Book`, `Person`), sitemap, canonical URLs, semantic HTML.
- **Security:** RLS everywhere, service role only on the server, input validation, rate limiting on AI routes, CSP/security headers, no secrets in the client bundle, sanitized user notes.
- **Reliability:** typed errors, error boundaries, friendly empty/loading/error states (designed, not defaults).
- **Legal:** only public-domain texts; include attribution to Project Gutenberg as required; clear note that translations are AI-generated.

---

## 13. Git & Commit Conventions

- Branch: `main` (add feature branches only if the owner wants PRs).
- **Conventional Commits:** `feat(reader): add modernization slider morph`, `fix(auth): handle expired session redirect`, `chore(deps): bump next`, `docs(plan): record font decision`, `refactor`, `perf`, `test`, `build`, `ci`.
- Subject ≤ 72 chars, imperative mood, body explains *why* when non-obvious.
- Commit after each meaningful, working unit (not each keystroke, not giant dumps). Each commit should build.
- Push after commits once the remote is set. Never force-push to `main`.
- Do not commit `_legacy/`, `.env*`, `node_modules`, `.next`.
- Add `README.md` (setup, scripts, going-live link) early and keep it current.

---

## 14. Roadmap & Checklist

Status legend: ☐ todo · ◐ in progress · ☑ done

**Phase 0: Prep**
- ☑ Move old files to `_legacy/` and gitignore it
- ☑ Write `plan.md`
- ☐ Owner provides GitHub repo URL; `git init` + set remote on first implementation step

**Phase 1: Foundation & Brand**
- ☐ Scaffold Next.js + TS + Tailwind, lint/format config, `.env.example`, `lib/env.ts`
- ☐ Design tokens, themes (ink/paper), fonts, global CSS (grain, focus, scrollbars)
- ☐ Brand: new logo mark/wordmark SVGs, favicon set, OG template, `docs/brand.md`
- ☐ UI primitives, motion primitives (Reveal, SplitText, Lenis provider, page transition), custom cursor
- ☐ Layout shell: glass nav, footer, theme toggle, command-palette stub
- ☐ README

**Phase 2: Data layer**
- ☐ Supabase migrations, RLS, indexes, types
- ☐ Repository interfaces + demo and Supabase implementations
- ☐ Bundled demo dataset (incl. sample levels + glossary)
- ☐ Auth (email + Google), middleware, profile creation trigger, guest→user merge

**Phase 3: Pages (on demo data first)**
- ☐ Home (hero, 3D covers, scroll story, slider demo, shelves)
- ☐ Explore (grid, filters, search)
- ☐ Book detail
- ☐ Authors, Collections
- ☐ About / How it works / legal pages

**Phase 4: Reader**
- ☐ Reader layout, single + split views, prefs
- ☐ Modernization slider with morph
- ☐ Glossary popovers, highlights, notes, bookmarks, progress
- ☐ Library page

**Phase 5: Content pipeline**
- ☐ `ingest-gutenberg` for the 12 books (+ chapter detection configs)
- ☐ `enrich-books`, `translate`, `embed`, `covers`, `seed-collections` (all with `--mock`)
- ☐ `content:status` report; document throttling/limits
- ☐ Procedural cover generator

**Phase 6: Live AI**
- ☐ Gateway, providers (Gemini + Mock), cache, quota, breaker
- ☐ Rewrite / Explain / Find-my-book UIs with Quill Ink meter
- ☐ Rate limiting + abuse protection
- ☐ Tests for quota/cache/gateway logic

**Phase 7: Polish & Launch**
- ☐ Perf + a11y + SEO passes, Lighthouse audit, cross-browser/responsive check
- ☐ Playwright smoke tests; Vitest unit tests for core libs
- ☐ `docs/going-live.md` verified, security headers, error monitoring hook (optional)
- ☐ Deploy to Vercel; production env checklist

**Stretch:** quote cards, character chat, streaks, compare page, read-aloud, PWA.

---

## 15. Decision Log

| Date | Decision | Why |
|---|---|---|
| 2026-11-23 | Next.js + TS + Supabase + Vercel; Gemini free tier for AI | Owner requirement; real backend, low cost |
| 2026-11-23 | Mostly pre-generated translations at 3 levels; live AI limited to rewrite/explain/recommend | Free-tier quota is small; instant UX; reviewable quality |
| 2026-11-23 | Dark ("Ink") default theme with light ("Paper") toggle | Matches logo; premium editorial feel |
| 2026-11-23 | Placeholder-key "demo mode" with repository pattern + MockProvider | App must work immediately and switch to live with zero code changes |
| 2026-11-23 | Old mockups/logo moved to gitignored `_legacy/` | Reference only; not part of the product |

_Add new rows as decisions are made (fonts chosen, versions pinned, deviations from this plan)._

---

## 16. Owner To-Do (things only the owner can do)

- ☐ Provide the GitHub repository URL
- ☐ Create Supabase project; supply URL, anon key, service-role key (when ready)
- ☐ Create Gemini API key in Google AI Studio (when ready)
- ☐ Configure Google OAuth in Supabase (Google Cloud Console credentials) (when ready)
- ☐ Create Vercel project and connect the repo (at deploy time)
- ☐ Approve the final logo direction when presented

_Update this list as new owner-only tasks appear._

---

## 17. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Free-tier limits slow the translation batch | Throttled, resumable queue; prioritize launch books and early chapters; multi-day runs are fine |
| Translation paragraph-count mismatch breaks split view | Structured JSON output + verification + retry + fallback to chunk-level alignment |
| AI translation quality varies | Versioned prompts, spot-check tooling, regenerate per chapter, clear "AI-generated" labeling |
| 3D/animation hurts performance | Lazy load, static fallback, reduced-motion mode, performance budget |
| Chapter detection differs per book | Per-book config and manual overrides in `scripts/config/books.ts` |
| Model names/limits change | Env-configured models; check official docs at implementation time |
| Gutenberg formatting oddities | Cleaning pass + per-book overrides; manual review of the first/last chapter per book |

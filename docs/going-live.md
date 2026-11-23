# Going live

Everything below is done **once**, in this order. The app works in demo mode until you finish each step, and each step switches on its own feature without code changes.

## 1. Create the Supabase project (about 10 minutes)

1. Sign in at <https://supabase.com> and create a **new project**. Pick a region near your readers and save the database password.
2. Open **SQL Editor** and run the contents of [`supabase/migrations/20261123000000_init.sql`](../supabase/migrations/20261123000000_init.sql). It creates the tables, row-level security policies and search functions.
3. Open **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key (never expose this in the browser or commit it)
4. Copy `.env.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
5. In **Authentication → URL Configuration** set the Site URL to `http://localhost:3000` for now and add `http://localhost:3000/auth/callback` to the redirect URLs. Add your production URLs later.

## 2. Google sign-in (optional but recommended)

1. In Google Cloud Console create an **OAuth client ID** (Web application).
2. Add Supabase's callback URL (shown in **Authentication → Providers → Google**) as an authorized redirect URI.
3. Paste the client ID and secret into the Supabase Google provider and enable it.

## 3. Gemini key

1. Create a key at <https://aistudio.google.com/apikey> and set `GEMINI_API_KEY` in `.env.local`.
2. Check your current free-tier limits in AI Studio. Set `GEMINI_BATCH_RPM` and `GEMINI_BATCH_RPD` (pipeline throttle) and, if you like, `AI_DAILY_LIMIT_ANON`, `AI_DAILY_LIMIT_USER` and `AI_GLOBAL_DAILY_CEILING` (live features).
3. If a model name has changed, set `GEMINI_MODEL_LIVE`, `GEMINI_MODEL_BATCH` and `GEMINI_MODEL_EMBED`. Defaults live in `config/ai.ts`.

## 4. Fill the library

```bash
npm run content:seed                      # authors, books, collections
npm run content:ingest                    # download and split all 12 books
npm run content:translate -- --mock       # optional: test the pipeline, no API calls
npm run content:translate -- --levels 2   # real "Modern" versions first (fastest way to a usable site)
npm run content:translate                 # then Light and Contemporary
npm run content:glossary
npm run content:embed
npm run content:status
```

- The translation step is **resumable and throttled**. On the free tier it can take many days for everything: it stops cleanly when the daily budget is used, and you re-run it the next day. Use `-- --dry-run` first to see the number of API calls.
- Chapters appear in the reader as soon as they are stored. Levels not generated yet are disabled in the slider.
- If you replace `--mock` output, re-run with `--force` so the real versions overwrite the placeholders.

## 5. Refresh the site cache

Catalogue reads are cached for about an hour. To refresh immediately after running scripts, set `REVALIDATE_SECRET` (any long random string) in `.env.local` and on the server, then run `npm run content:revalidate`.

## 6. Deploy to Vercel

1. Import the GitHub repository in Vercel.
2. Add every variable from `.env.local` to the project's Environment Variables (set `NEXT_PUBLIC_SITE_URL` to your production URL).
3. In Supabase add the production URL and `https://<your-domain>/auth/callback` to the redirect URLs, and update the Google OAuth origins if needed.
4. Deploy. Visit `/sitemap.xml` to check the catalogue is listed.

## Checklist

- [ ] Sign up and sign in work, and a highlight made as a guest appears after signing in
- [ ] A book shows all chapters and the slider enables the levels you generated
- [ ] "Explain" and "Rewrite" return real answers and the ink meter drops
- [ ] "Tell the quill" on Explore returns three books
- [ ] `npm run content:status` shows the expected counts

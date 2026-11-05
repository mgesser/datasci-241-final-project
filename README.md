# LinguaQuest — DATASCI 241 Final Project

A gamified language-learning web app. Upload a text, click unfamiliar words to save them,
then practice them in quizzes that earn XP, streaks and badges.

See [docs/OUTLINE.md](docs/OUTLINE.md) for the full project outline.

## Run locally

It's a static site, but ES modules need to be served over HTTP (not opened as a file):

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Structure

```
index.html          App shell + nav
css/styles.css      Styles
js/app.js           Router, HUD, shared helpers
js/store.js         localStorage persistence + gamification logic
js/badges.js        Badge definitions
js/views/           dashboard, reader, vocab, quiz, leaderboard
js/leaderboard.js   Supabase client for the leaderboard
js/notifications.js Daily practice reminders
js/config.js        Supabase URL + anon key (empty = leaderboard off)
supabase/schema.sql Database table + security policies
docs/OUTLINE.md     Project outline
```

## Leaderboard setup (Supabase)

The leaderboard is optional. Without a Supabase project the rest of the app works and the
Leaderboard page just says it isn't set up.

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor** → New query → paste [supabase/schema.sql](supabase/schema.sql) → Run.
3. **Authentication → Sign In / Providers** → enable **Allow anonymous sign-ins**.
4. **Project Settings → API**: copy the Project URL and the `anon` public key into
   [js/config.js](js/config.js). (The anon key is meant to be public. Never use the `service_role` key.)

Players join with a public nickname and an anonymous login (no email or password). Scores are
reported by the browser, so the board is trust-based: fine for a class project, not for prizes.

## Deploy

Push to GitHub and enable GitHub Pages (Settings → Pages → deploy from `main`, root).

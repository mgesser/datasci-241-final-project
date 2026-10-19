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
js/views/           dashboard, reader, vocab, quiz
docs/OUTLINE.md     Project outline
```

## Deploy

Push to GitHub and enable GitHub Pages (Settings → Pages → deploy from `main`, root).

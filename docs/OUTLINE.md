# Project Outline — Gamified Language Learning Web App

DATASCI 241 Final Project

## 1. Goal

A web app where a learner uploads or pastes a text in the language they're learning,
reads it, marks unfamiliar words, and then practices those words through gamified quizzes.

## 2. Core Features

### 2.1 Reader
- Upload a `.txt` file or paste text.
- Text is tokenized into clickable words.
- Clicking a word opens a panel to save it with a translation/definition and the sentence it came from.
- Saved words are highlighted in the text. Words you have already mastered get a different color.
- Multiple texts saved in a library.

### 2.2 Vocabulary
- List of all saved words: word, translation, context sentence, source text, mastery level.
- Edit, delete, search, filter by mastery.
- Export/import as CSV/JSON (backup + sharing).

### 2.3 Quiz
- Question types:
  - Multiple choice (word → translation, translation → word)
  - Typed answer
  - Cloze (fill the blank in the original context sentence)
- Words chosen by spaced repetition (weak/overdue words first).
- Immediate feedback, then a session summary.

### 2.4 Gamification
- **XP** for correct answers; bonus for combos (consecutive correct).
- **Levels** from total XP.
- **Daily streak** (days in a row with at least one quiz).
- **Hearts/lives** per quiz session (optional mode).
- **Badges** (first word saved, 50 words, 7-day streak, perfect quiz, ...).
- **Mastery** per word (0–5), shown as progress on the dashboard.

### 2.5 Dashboard
- Level, XP bar, streak, words learned, daily goal progress, badges.

## 3. UI Structure

Single-page app with hash routing:

| Route         | View       | Purpose                                 |
|---------------|------------|-----------------------------------------|
| `#/`          | Dashboard  | Stats, streak, daily goal, start quiz   |
| `#/reader`    | Reader     | Library + upload/paste + reading view   |
| `#/vocab`     | Vocabulary | Manage saved words                      |
| `#/quiz`      | Quiz       | Gamified practice session               |

Persistent top bar: app name, nav links, XP/level/streak at a glance.

## 4. Architecture

- **Frontend:** vanilla HTML/CSS/JavaScript (ES modules), no build step.
- **Storage:** browser `localStorage` behind a small `store.js` module, so it can be swapped
  for a real backend later without touching the views.
- **Hosting:** static hosting (GitHub Pages / Netlify / Vercel).
- **Backend (optional, later):** if we need accounts or cross-device sync, add a light
  API (e.g. FastAPI + SQLite, or Supabase/Firebase). The `store.js` interface stays the same.

### Data model

```
Text  { id, title, content, language, createdAt }
Word  { id, word, translation, context, textId, mastery (0-5),
        correct, incorrect, lastSeen, nextReview, createdAt }
Stats { xp, streak, lastActiveDate, dailyGoal, todayXp, badges[] }
```

## 5. Data Science Angle (for the course)
- Log every quiz answer (word, correct, response time, timestamp).
- Analyze: retention curves, which question types work best, difficulty by word frequency/length.
- Possibly fit a simple model to predict recall probability (half-life regression style)
  to drive the spaced-repetition scheduler.

## 6. Milestones

1. **UI scaffold** — routing, layout, all four views, localStorage store. *(in progress)*
2. **Reader** — upload/paste, tokenization, save words.
3. **Quiz** — question generation, scoring, XP, spaced repetition.
4. **Gamification polish** — badges, streaks, animations, sounds.
5. **Analytics** — answer logs, export, analysis notebook.
6. **Deploy** — GitHub Pages.
7. *(Optional)* Backend for accounts/sync; auto-translation API.

## 7. Open Questions
- Target language(s)? Affects tokenization (e.g. Chinese/Japanese have no spaces).
- Manual translations vs. dictionary/translation API?
- Single user locally vs. accounts?

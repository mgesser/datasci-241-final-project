// Persistence layer. Everything goes through here so localStorage can later be
// swapped for a real backend without touching the views.

const KEY = "linguaquest:v1";

const defaultState = () => ({
  texts: [],
  words: [],
  answers: [], // quiz answer log, for analytics
  stats: {
    xp: 0,
    streak: 0,
    lastActiveDate: null,
    dailyGoal: 50,
    todayXp: 0,
    badges: [],
  },
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch {
    return defaultState();
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("store:change"));
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const today = () => new Date().toISOString().slice(0, 10);

// ---------- Texts ----------
export const getTexts = () => state.texts;
export const getText = (id) => state.texts.find((t) => t.id === id);

export function addText(title, content) {
  const text = { id: uid(), title, content, createdAt: Date.now() };
  state.texts.unshift(text);
  save();
  return text;
}

export function deleteText(id) {
  state.texts = state.texts.filter((t) => t.id !== id);
  save();
}

// ---------- Words ----------
export const getWords = () => state.words;
export const findWord = (word) =>
  state.words.find((w) => w.word.toLowerCase() === word.toLowerCase());

export function addWord({ word, translation, context = "", textId = null }) {
  const existing = findWord(word);
  if (existing) {
    Object.assign(existing, { translation, context: context || existing.context });
    save();
    return existing;
  }
  const entry = {
    id: uid(), word, translation, context, textId,
    mastery: 0, correct: 0, incorrect: 0,
    lastSeen: null, nextReview: Date.now(), createdAt: Date.now(),
  };
  state.words.push(entry);
  save();
  return entry;
}

export function updateWord(id, patch) {
  const w = state.words.find((x) => x.id === id);
  if (w) { Object.assign(w, patch); save(); }
}

export function deleteWord(id) {
  state.words = state.words.filter((w) => w.id !== id);
  save();
}

// ---------- Stats / gamification ----------
export const getStats = () => state.stats;

export const levelFromXp = (xp) => Math.floor(Math.sqrt(xp / 25)) + 1;
export const xpForLevel = (level) => 25 * (level - 1) ** 2;

// Simple spaced-repetition intervals (days) indexed by mastery level.
const INTERVALS = [0, 1, 2, 4, 8, 16];

export function recordAnswer(wordId, correct, ms) {
  const w = state.words.find((x) => x.id === wordId);
  if (!w) return;
  if (correct) {
    w.correct++;
    w.mastery = Math.min(5, w.mastery + 1);
  } else {
    w.incorrect++;
    w.mastery = Math.max(0, w.mastery - 1);
  }
  w.lastSeen = Date.now();
  w.nextReview = Date.now() + INTERVALS[w.mastery] * 86400000;
  state.answers.push({ wordId, correct, ms, at: Date.now() });
  save();
}

export function addXp(amount) {
  const s = state.stats;
  const d = today();
  if (s.lastActiveDate !== d) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    s.streak = s.lastActiveDate === yesterday ? s.streak + 1 : 1;
    s.lastActiveDate = d;
    s.todayXp = 0;
  }
  s.xp += amount;
  s.todayXp += amount;
  save();
}

// Returns today's XP, treating a stale day as 0.
export const todayXp = () =>
  state.stats.lastActiveDate === today() ? state.stats.todayXp : 0;

export function awardBadge(id) {
  if (state.stats.badges.includes(id)) return false;
  state.stats.badges.push(id);
  save();
  return true;
}

// ---------- Import / export ----------
export const exportData = () => JSON.stringify(state, null, 2);
export function importData(json) {
  state = { ...defaultState(), ...JSON.parse(json) };
  save();
}

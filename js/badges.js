import { getStats, getWords, awardBadge } from "./store.js";
import { toast } from "./utils.js";

export const BADGES = [
  { id: "first-word", icon: "🌱", name: "First Word", test: (s, w) => w.length >= 1 },
  { id: "words-25", icon: "📚", name: "Collector (25 words)", test: (s, w) => w.length >= 25 },
  { id: "words-100", icon: "🏛️", name: "Librarian (100 words)", test: (s, w) => w.length >= 100 },
  { id: "mastered-10", icon: "🧠", name: "10 Words Mastered", test: (s, w) => w.filter((x) => x.mastery >= 5).length >= 10 },
  { id: "streak-3", icon: "🔥", name: "3-Day Streak", test: (s) => s.streak >= 3 },
  { id: "streak-7", icon: "🌋", name: "7-Day Streak", test: (s) => s.streak >= 7 },
  { id: "xp-500", icon: "⚡", name: "500 XP", test: (s) => s.xp >= 500 },
  { id: "perfect", icon: "💎", name: "Perfect Quiz", test: () => false }, // awarded by quiz directly
];

export function checkBadges() {
  const s = getStats();
  const w = getWords();
  for (const b of BADGES) {
    if (b.test(s, w) && awardBadge(b.id)) toast(`${b.icon} Badge unlocked: ${b.name}`);
  }
}

import { getStats, getWords, levelFromXp, xpForLevel, todayXp } from "../store.js";
import { BADGES } from "../badges.js";

export function renderDashboard(root) {
  const s = getStats();
  const words = getWords();
  const level = levelFromXp(s.xp);
  const lo = xpForLevel(level);
  const hi = xpForLevel(level + 1);
  const levelPct = ((s.xp - lo) / (hi - lo)) * 100;
  const goalPct = Math.min(100, (todayXp() / s.dailyGoal) * 100);
  const mastered = words.filter((w) => w.mastery >= 5).length;
  const due = words.filter((w) => w.nextReview <= Date.now()).length;

  root.innerHTML = `
    <h1>Welcome back! 👋</h1>

    <div class="grid grid-4">
      <div class="card stat"><div class="value">🔥 ${s.streak}</div><div class="label">Day streak</div></div>
      <div class="card stat"><div class="value">⭐ ${level}</div><div class="label">Level</div></div>
      <div class="card stat"><div class="value">📖 ${words.length}</div><div class="label">Words saved</div></div>
      <div class="card stat"><div class="value">🧠 ${mastered}</div><div class="label">Mastered</div></div>
    </div>

    <div class="grid" style="grid-template-columns: 1fr 1fr; margin-top: 1rem;">
      <div class="card stack">
        <strong>Daily goal</strong>
        <div class="progress gold"><div style="width:${goalPct}%"></div></div>
        <span class="muted">${todayXp()} / ${s.dailyGoal} XP today</span>
      </div>
      <div class="card stack">
        <strong>Level ${level} → ${level + 1}</strong>
        <div class="progress"><div style="width:${levelPct}%"></div></div>
        <span class="muted">${s.xp - lo} / ${hi - lo} XP</span>
      </div>
    </div>

    <div class="card" style="margin-top: 1rem; text-align:center;">
      ${
        words.length
          ? `<p><strong>${due}</strong> word${due === 1 ? "" : "s"} due for review</p>
             <a class="btn" href="#/quiz">Start practice</a>`
          : `<p class="muted">You haven't saved any words yet.</p>
             <a class="btn" href="#/reader">Open the reader</a>`
      }
    </div>

    <div class="card stack" style="margin-top: 1rem;">
      <strong>Badges</strong>
      <div class="badges">
        ${BADGES.map(
          (b) => `<span class="badge ${s.badges.includes(b.id) ? "" : "locked"}">${b.icon} ${b.name}</span>`
        ).join("")}
      </div>
    </div>
  `;
}

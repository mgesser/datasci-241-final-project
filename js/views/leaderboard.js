import { getStats, getAnswerTotals, getSettings, levelFromXp } from "../store.js";
import { toast, escapeHtml } from "../utils.js";
import {
  isConfigured, joinLeaderboard, leaveLeaderboard, fetchBoard, fetchRank, myId, pushScore,
} from "../leaderboard.js";

const MEDALS = ["🥇", "🥈", "🥉"];

export function renderLeaderboard(root) {
  root.innerHTML = `<h1>Leaderboard 🏆</h1><div id="lb"></div>`;
  const el = root.querySelector("#lb");

  if (!isConfigured()) {
    el.innerHTML = `
      <div class="card empty">
        <h2>Leaderboard not set up</h2>
        <p>Add your Supabase project details to <code>js/config.js</code>. See the README for the steps.</p>
      </div>`;
    return;
  }
  if (!getSettings().leaderboardJoined) return renderJoin(root, el);
  renderBoard(root, el);
}

function renderJoin(root, el) {
  el.innerHTML = `
    <div class="card stack" style="max-width:480px; margin:0 auto">
      <h2 style="margin:0">Join the leaderboard</h2>
      <p class="muted" style="margin:0">Pick a nickname. It's public, so don't use your real name.
        Only your nickname, XP, streak and accuracy are shared. You can leave at any time.</p>
      <input type="text" id="nick" maxlength="20" placeholder="Nickname" autocomplete="off" />
      <div id="err" style="color:var(--danger); font-weight:700"></div>
      <button class="btn" id="join">Join</button>
    </div>`;
  const nick = el.querySelector("#nick");
  const err = el.querySelector("#err");
  const btn = el.querySelector("#join");

  const go = async () => {
    err.textContent = "";
    btn.disabled = true;
    try {
      await joinLeaderboard(nick.value);
      toast("You're on the leaderboard!");
      renderLeaderboard(root);
    } catch (e) {
      err.textContent = e.message || "Couldn't join. Check your connection and try again.";
      btn.disabled = false;
    }
  };
  btn.onclick = go;
  nick.addEventListener("keydown", (e) => e.key === "Enter" && go());
  nick.focus();
}

async function renderBoard(root, el) {
  el.innerHTML = `<div class="card empty">Loading…</div>`;
  try {
    await pushScore().catch(() => {}); // make sure the board reflects your latest progress
    const [rows, me] = await Promise.all([fetchBoard(), myId()]);
    if (!root.isConnected || !el.isConnected) return; // navigated away while loading

    const mine = rows.find((r) => r.user_id === me);
    const xp = getStats().xp;
    const rank = mine ? rows.indexOf(mine) + 1 : await fetchRank(xp);
    const t = getAnswerTotals();

    el.innerHTML = `
      <div class="card row" style="margin-bottom:1rem">
        <div style="flex:1">
          <div class="muted">Your rank</div>
          <div style="font-size:2rem; font-weight:800">#${rank}</div>
        </div>
        <div style="flex:1">
          <div class="muted">${escapeHtml(getSettings().leaderboardNickname)}</div>
          <div style="font-weight:700">⚡ ${xp} XP · ⭐ Lv ${levelFromXp(xp)} · 🎯 ${t.accuracy}%</div>
        </div>
        <button class="btn small secondary" id="refresh">Refresh</button>
        <button class="btn small secondary" id="leave">Leave</button>
      </div>
      <div class="card">
        ${rows.length ? `
        <table>
          <thead><tr><th>#</th><th>Player</th><th>XP</th><th>Streak</th><th>Accuracy</th></tr></thead>
          <tbody>
            ${rows.map((r, i) => `
              <tr class="${r.user_id === me ? "me" : ""}">
                <td>${MEDALS[i] ?? i + 1}</td>
                <td><strong>${escapeHtml(r.nickname)}</strong>${r.user_id === me ? " (you)" : ""}</td>
                <td>⚡ ${r.xp}</td>
                <td>🔥 ${r.streak}</td>
                <td>${r.total ? Math.round((r.correct / r.total) * 100) + "%" : "–"}</td>
              </tr>`).join("")}
          </tbody>
        </table>` : `<div class="empty">No players yet.</div>`}
      </div>`;

    el.querySelector("#refresh").onclick = () => renderBoard(root, el);
    el.querySelector("#leave").onclick = async () => {
      if (!confirm("Leave the leaderboard? Your entry will be removed.")) return;
      try { await leaveLeaderboard(); renderLeaderboard(root); }
      catch { toast("Couldn't leave right now. Try again."); }
    };
  } catch {
    if (!el.isConnected) return;
    el.innerHTML = `<div class="card empty"><p>Couldn't load the leaderboard.</p>
      <button class="btn" id="retry">Try again</button></div>`;
    el.querySelector("#retry").onclick = () => renderBoard(root, el);
  }
}

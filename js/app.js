import { getStats, levelFromXp } from "./store.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderReader } from "./views/reader.js";
import { renderVocab } from "./views/vocab.js";
import { renderQuiz } from "./views/quiz.js";

const routes = {
  "/": renderDashboard,
  "/reader": renderReader,
  "/vocab": renderVocab,
  "/quiz": renderQuiz,
};

const app = document.getElementById("app");

function router() {
  const path = location.hash.slice(1) || "/";
  const render = routes[path] || renderDashboard;
  app.innerHTML = "";
  render(app);
  document.querySelectorAll(".topbar nav a").forEach((a) =>
    a.classList.toggle("active", a.dataset.route === path)
  );
}

function renderHud() {
  const s = getStats();
  document.getElementById("hud").innerHTML = `
    <span title="Streak">🔥 ${s.streak}</span>
    <span title="XP">⚡ ${s.xp}</span>
    <span title="Level">⭐ Lv ${levelFromXp(s.xp)}</span>
  `;
}

window.addEventListener("hashchange", router);
window.addEventListener("store:change", renderHud);
renderHud();
router();

import { getWords, recordAnswer, addXp, awardBadge } from "../store.js";
import { toast, escapeHtml } from "../utils.js";
import { checkBadges } from "../badges.js";

const SESSION_SIZE = 10;
const HEARTS = 3;
const XP_PER_CORRECT = 10;

let session = null;

const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);

function buildSession() {
  const words = getWords();
  // Due words first, then weakest mastery.
  const pool = [...words].sort((a, b) => (a.nextReview - b.nextReview) || (a.mastery - b.mastery));
  const picked = shuffle(pool.slice(0, SESSION_SIZE));
  const questions = picked.map((w) => makeQuestion(w, words));
  return { questions, i: 0, hearts: HEARTS, combo: 0, xp: 0, correct: 0, answered: false, start: 0 };
}

function makeQuestion(word, all) {
  const others = all.filter((w) => w.id !== word.id);
  const types = others.length >= 3 ? ["mc-forward", "mc-reverse", "typed"] : ["typed"];
  if (word.context && word.context.toLowerCase().includes(word.word.toLowerCase())) types.push("cloze");
  const type = types[Math.floor(Math.random() * types.length)];
  const distractors = shuffle(others).slice(0, 3);

  switch (type) {
    case "mc-forward":
      return { word, type, prompt: word.word, hint: "Choose the meaning",
        answer: word.translation, choices: shuffle([word.translation, ...distractors.map((d) => d.translation)]) };
    case "mc-reverse":
      return { word, type, prompt: word.translation, hint: "Choose the word",
        answer: word.word, choices: shuffle([word.word, ...distractors.map((d) => d.word)]) };
    case "cloze": {
      const re = new RegExp(word.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      return { word, type, prompt: word.context.replace(re, "_____"), hint: `Fill the blank (${word.translation})`,
        answer: word.word };
    }
    default:
      return { word, type: "typed", prompt: word.translation, hint: "Type the word", answer: word.word };
  }
}

export function renderQuiz(root) {
  if (getWords().length < 1) {
    root.innerHTML = `<div class="card empty"><h2>Nothing to practice yet</h2>
      <p>Save words from the reader to unlock quizzes.</p><a class="btn" href="#/reader">Open reader</a></div>`;
    return;
  }
  if (!session) {
    root.innerHTML = `<div class="card empty">
      <h2>Ready to practice?</h2>
      <p>${Math.min(SESSION_SIZE, getWords().length)} questions · ❤️ ${HEARTS} lives · +${XP_PER_CORRECT} XP each, combo bonuses</p>
      <button class="btn" id="go">Start</button></div>`;
    root.querySelector("#go").onclick = () => { session = buildSession(); renderQuestion(root); };
    return;
  }
  renderQuestion(root);
}

function renderQuestion(root) {
  const s = session;
  if (s.i >= s.questions.length || s.hearts <= 0) return renderSummary(root);

  const q = s.questions[s.i];
  s.answered = false;
  s.start = performance.now();
  const pct = (s.i / s.questions.length) * 100;
  const isMc = !!q.choices;

  root.innerHTML = `
    <div class="card">
      <div class="quiz-top">
        <button class="btn small secondary" id="quit">✕</button>
        <div class="progress"><div style="width:${pct}%"></div></div>
        <strong>${"❤️".repeat(s.hearts)}${"🤍".repeat(HEARTS - s.hearts)}</strong>
      </div>
      <p class="muted" style="text-align:center">${escapeHtml(q.hint)}</p>
      <div class="prompt">${escapeHtml(q.prompt)}</div>
      ${
        isMc
          ? `<div class="choices">${q.choices.map((c) => `<button class="choice">${escapeHtml(c)}</button>`).join("")}</div>`
          : `<div class="row"><input type="text" id="answer" placeholder="Your answer" autocomplete="off" />
             <button class="btn" id="check">Check</button></div>`
      }
      <div id="feedback"></div>
      ${s.combo >= 2 ? `<p class="combo" style="text-align:center">🔥 ${s.combo} in a row!</p>` : ""}
    </div>
  `;

  root.querySelector("#quit").onclick = () => { session = null; renderQuiz(root); };

  if (isMc) {
    root.querySelectorAll(".choice").forEach((btn) =>
      btn.addEventListener("click", () => submit(root, btn.textContent, btn))
    );
  } else {
    const input = root.querySelector("#answer");
    input.focus();
    const go = () => submit(root, input.value);
    root.querySelector("#check").onclick = go;
    input.addEventListener("keydown", (e) => e.key === "Enter" && go());
  }
}

const normalize = (s) => s.trim().toLowerCase().normalize("NFC");

function submit(root, value, btn) {
  const s = session;
  if (s.answered) return;
  s.answered = true;
  const q = s.questions[s.i];
  const correct = normalize(value) === normalize(q.answer);
  recordAnswer(q.word.id, correct, Math.round(performance.now() - s.start));

  if (correct) {
    s.correct++;
    s.combo++;
    const gained = XP_PER_CORRECT + (s.combo >= 3 ? 5 : 0);
    s.xp += gained;
  } else {
    s.combo = 0;
    s.hearts--;
  }

  if (btn) {
    root.querySelectorAll(".choice").forEach((b) => {
      b.disabled = true;
      if (b.textContent === q.answer) b.classList.add("correct");
    });
    if (!correct) btn.classList.add("wrong");
  }

  root.querySelector("#feedback").innerHTML = `
    <div class="feedback ${correct ? "good" : "bad"} row">
      <span style="flex:1">${correct ? "✅ Correct!" : `❌ Answer: ${escapeHtml(q.answer)}`}</span>
      <button class="btn small" id="next">Continue</button>
    </div>`;
  const next = root.querySelector("#next");
  next.focus();
  next.onclick = () => { s.i++; renderQuestion(root); };
}

function renderSummary(root) {
  const s = session;
  const total = s.questions.length;
  const perfect = s.correct === total && s.hearts === HEARTS;
  if (perfect) s.xp += 20;
  if (s.xp) addXp(s.xp);
  if (perfect && awardBadge("perfect")) toast("💎 Badge unlocked: Perfect Quiz");
  checkBadges();

  root.innerHTML = `
    <div class="card empty">
      <h2>${s.hearts <= 0 ? "Out of hearts 💔" : perfect ? "Perfect! 💎" : "Lesson complete! 🎉"}</h2>
      <div class="grid grid-4" style="max-width:500px; margin: 1.5rem auto;">
        <div class="stat"><div class="value">⚡ ${s.xp}</div><div class="label">XP earned</div></div>
        <div class="stat"><div class="value">🎯 ${Math.round((s.correct / total) * 100)}%</div><div class="label">Accuracy</div></div>
      </div>
      <div class="row" style="justify-content:center">
        <a class="btn secondary" href="#/">Dashboard</a>
        <button class="btn" id="again">Practice again</button>
      </div>
    </div>
  `;
  session = null;
  root.querySelector("#again").onclick = () => { session = buildSession(); renderQuestion(root); };
}

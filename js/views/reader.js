import { getTexts, getText, addText, deleteText, findWord, addWord } from "../store.js";
import { toast, escapeHtml } from "../utils.js";
import { checkBadges } from "../badges.js";

let activeId = null;

// Unicode-aware: letters (any script), marks, apostrophes and hyphens inside words.
const WORD_RE = /[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/gu;

export function renderReader(root) {
  const texts = getTexts();
  if (activeId && !getText(activeId)) activeId = null;

  root.innerHTML = `
    <h1>Reader</h1>
    <div class="grid grid-2">
      <aside class="card stack">
        <button class="btn" id="new-text">+ New text</button>
        <div>
          ${
            texts.length
              ? texts.map((t) => `<div class="library-item ${t.id === activeId ? "active" : ""}" data-id="${t.id}">${escapeHtml(t.title)}</div>`).join("")
              : `<p class="muted">No texts yet.</p>`
          }
        </div>
      </aside>
      <section class="card" id="reader-main"></section>
    </div>
    <div id="panel-slot"></div>
  `;

  root.querySelector("#new-text").onclick = () => { activeId = null; renderUpload(root); };
  root.querySelectorAll(".library-item").forEach((el) =>
    el.addEventListener("click", () => { activeId = el.dataset.id; renderReader(root); })
  );

  activeId ? renderText(root) : renderUpload(root);
}

function renderUpload(root) {
  const main = root.querySelector("#reader-main");
  root.querySelectorAll(".library-item").forEach((el) => el.classList.remove("active"));
  main.innerHTML = `
    <div class="stack">
      <h2 style="margin:0">Add a text</h2>
      <input type="text" id="title" placeholder="Title" />
      <textarea id="content" placeholder="Paste text in the language you're learning…"></textarea>
      <div class="row">
        <label class="btn secondary">
          Upload .txt <input type="file" id="file" accept=".txt,text/plain" hidden />
        </label>
        <span style="flex:1"></span>
        <button class="btn" id="save">Save &amp; read</button>
      </div>
    </div>
  `;

  main.querySelector("#file").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    main.querySelector("#content").value = await file.text();
    const title = main.querySelector("#title");
    if (!title.value) title.value = file.name.replace(/\.[^.]+$/, "");
  };

  main.querySelector("#save").onclick = () => {
    const content = main.querySelector("#content").value.trim();
    const title = main.querySelector("#title").value.trim() || content.slice(0, 30) || "Untitled";
    if (!content) return toast("Add some text first");
    activeId = addText(title, content).id;
    renderReader(root);
  };
}

function renderText(root) {
  const text = getText(activeId);
  const main = root.querySelector("#reader-main");

  // Wrap each word in a span; keep everything else (spaces, punctuation) as-is.
  let html = "";
  let last = 0;
  for (const m of text.content.matchAll(WORD_RE)) {
    html += escapeHtml(text.content.slice(last, m.index));
    const saved = findWord(m[0]);
    const cls = saved ? (saved.mastery >= 5 ? "w mastered" : "w saved") : "w";
    html += `<span class="${cls}" data-i="${m.index}">${escapeHtml(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  html += escapeHtml(text.content.slice(last));

  main.innerHTML = `
    <div class="row" style="margin-bottom:1rem">
      <h2 style="margin:0; flex:1">${escapeHtml(text.title)}</h2>
      <button class="btn small danger" id="del">Delete</button>
    </div>
    <p class="muted" style="margin-top:0">Click any word to save it to your vocabulary.</p>
    <div class="reading">${html}</div>
  `;

  main.querySelector("#del").onclick = () => {
    if (!confirm("Delete this text?")) return;
    deleteText(activeId);
    activeId = null;
    renderReader(root);
  };

  main.querySelector(".reading").addEventListener("click", (e) => {
    const span = e.target.closest(".w");
    if (span) openWordPanel(root, span.textContent, contextSentence(text.content, +span.dataset.i));
  });
}

function contextSentence(content, index) {
  const start = Math.max(content.lastIndexOf(".", index), content.lastIndexOf("\n", index), content.lastIndexOf("!", index), content.lastIndexOf("?", index)) + 1;
  const ends = [".", "!", "?", "\n"].map((c) => content.indexOf(c, index)).filter((i) => i !== -1);
  const end = ends.length ? Math.min(...ends) + 1 : content.length;
  return content.slice(start, end).trim();
}

function openWordPanel(root, word, context) {
  const existing = findWord(word);
  const slot = root.querySelector("#panel-slot");
  slot.innerHTML = `
    <div class="card word-panel stack">
      <div class="row"><strong style="font-size:1.4rem; flex:1">${escapeHtml(word)}</strong>
        <button class="btn small secondary" id="close">✕</button></div>
      <p class="muted" style="margin:0"><em>${escapeHtml(context)}</em></p>
      <input type="text" id="translation" placeholder="Translation / meaning" value="${escapeHtml(existing?.translation || "")}" />
      <button class="btn" id="save-word">${existing ? "Update" : "Save word"}</button>
    </div>
  `;
  const input = slot.querySelector("#translation");
  input.focus();
  const close = () => (slot.innerHTML = "");
  const save = () => {
    const translation = input.value.trim();
    if (!translation) return toast("Enter a translation");
    addWord({ word, translation, context, textId: activeId });
    toast(`Saved “${word}”`);
    checkBadges();
    close();
    renderText(root);
  };
  slot.querySelector("#close").onclick = close;
  slot.querySelector("#save-word").onclick = save;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") close();
  });
}

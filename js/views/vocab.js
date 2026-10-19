import { getWords, updateWord, deleteWord, exportData, importData } from "../store.js";
import { toast, escapeHtml } from "../utils.js";

let query = "";

export function renderVocab(root) {
  root.innerHTML = `
    <div class="row" style="margin-bottom:1rem">
      <h1 style="margin:0; flex:1">Vocabulary</h1>
      <button class="btn small secondary" id="export">Export</button>
      <label class="btn small secondary">Import<input type="file" id="import" accept=".json" hidden /></label>
    </div>
    <div class="card stack">
      <input type="search" id="search" placeholder="Search words…" value="${escapeHtml(query)}" />
      <div id="table"></div>
    </div>
  `;

  const search = root.querySelector("#search");
  search.oninput = () => { query = search.value; renderTable(root); };

  root.querySelector("#export").onclick = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `linguaquest-${new Date().toISOString().slice(0, 10)}.json`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  root.querySelector("#import").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm("Importing replaces all current data. Continue?")) return;
    try {
      importData(await file.text());
      toast("Data imported");
      renderVocab(root);
    } catch {
      toast("Invalid file");
    }
  };

  renderTable(root);
}

function renderTable(root) {
  const q = query.toLowerCase();
  const words = getWords().filter(
    (w) => w.word.toLowerCase().includes(q) || w.translation.toLowerCase().includes(q)
  );
  const el = root.querySelector("#table");

  if (!getWords().length) {
    el.innerHTML = `<div class="empty">No words yet. Save some from the <a href="#/reader"><strong>Reader</strong></a>.</div>`;
    return;
  }

  el.innerHTML = `
    <table>
      <thead><tr><th>Word</th><th>Translation</th><th>Context</th><th>Mastery</th><th></th></tr></thead>
      <tbody>
        ${words.map((w) => `
          <tr data-id="${w.id}">
            <td><strong>${escapeHtml(w.word)}</strong></td>
            <td contenteditable="true" class="edit-tr">${escapeHtml(w.translation)}</td>
            <td class="muted"><small>${escapeHtml(w.context)}</small></td>
            <td class="mastery" title="${w.mastery}/5">${"★".repeat(w.mastery)}${"☆".repeat(5 - w.mastery)}</td>
            <td><button class="btn small danger del">✕</button></td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;

  el.querySelectorAll("tr[data-id]").forEach((tr) => {
    const id = tr.dataset.id;
    tr.querySelector(".del").onclick = () => { deleteWord(id); renderTable(root); };
    tr.querySelector(".edit-tr").onblur = (e) => updateWord(id, { translation: e.target.textContent.trim() });
  });
}

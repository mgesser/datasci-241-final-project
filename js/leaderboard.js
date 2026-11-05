import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { getStats, getAnswerTotals, getSettings, updateSettings, currentStreak } from "./store.js";

// Loaded on demand so the rest of the app works offline or with no leaderboard configured.
const SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
const NICKNAME_RE = /^[\p{L}\p{N}_ -]{2,20}$/u;
const BOARD_SIZE = 50;

export const isConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let clientPromise;
function client() {
  clientPromise ??= import(SDK_URL)
    .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY))
    .catch((e) => { clientPromise = undefined; throw e; });
  return clientPromise;
}

// The signed-in player's id, or null if they have no session yet.
export async function myId() {
  const sb = await client();
  const { data } = await sb.auth.getSession();
  return data.session?.user.id ?? null;
}

// Anonymous sign-in: no email or password; the session lives in this browser.
async function ensureUserId() {
  const existing = await myId();
  if (existing) return existing;
  const sb = await client();
  const { data, error } = await sb.auth.signInAnonymously();
  if (error) throw error;
  return data.user.id;
}

export const validNickname = (n) => NICKNAME_RE.test(n.trim());

let lastSent = "";

export async function pushScore({ force = false } = {}) {
  const s = getSettings();
  const stats = getStats();
  const { correct, total } = getAnswerTotals();
  const row = { xp: stats.xp, streak: currentStreak(), correct, total };
  const key = JSON.stringify([s.leaderboardNickname, row]);
  if (!force && key === lastSent) return;

  const sb = await client();
  const user_id = await ensureUserId();
  const { error } = await sb.from("leaderboard")
    .upsert({ user_id, nickname: s.leaderboardNickname, ...row }, { onConflict: "user_id" });
  if (error) throw error;
  lastSent = key;
}

export async function joinLeaderboard(nickname) {
  nickname = nickname.trim();
  if (!validNickname(nickname)) {
    throw new Error("Nicknames are 2–20 characters: letters, numbers, spaces, - or _.");
  }
  const previous = getSettings().leaderboardNickname;
  updateSettings({ leaderboardNickname: nickname });
  try {
    await pushScore({ force: true });
  } catch (e) {
    updateSettings({ leaderboardNickname: previous });
    throw e.code === "23505" ? new Error("That nickname is taken — try another.") : e;
  }
  updateSettings({ leaderboardJoined: true });
}

export async function leaveLeaderboard() {
  const sb = await client();
  const id = await myId();
  if (id) {
    const { error } = await sb.from("leaderboard").delete().eq("user_id", id);
    if (error) throw error;
  }
  lastSent = "";
  updateSettings({ leaderboardJoined: false });
}

export async function fetchBoard() {
  const sb = await client();
  const { data, error } = await sb.from("leaderboard")
    .select("user_id, nickname, xp, streak, correct, total")
    .order("xp", { ascending: false })
    .order("updated_at", { ascending: true })
    .limit(BOARD_SIZE);
  if (error) throw error;
  return data;
}

// 1-based rank by XP (ties share the better rank).
export async function fetchRank(xp) {
  const sb = await client();
  const { count, error } = await sb.from("leaderboard")
    .select("user_id", { count: "exact", head: true })
    .gt("xp", xp);
  if (error) throw error;
  return count + 1;
}

// Keeps the player's row up to date, a few seconds after their data changes.
let timer;
export function startLeaderboardSync() {
  if (!isConfigured()) return;
  window.addEventListener("store:change", () => {
    if (!getSettings().leaderboardJoined) return;
    clearTimeout(timer);
    timer = setTimeout(() => pushScore().catch(() => {}), 3000);
  });
  if (getSettings().leaderboardJoined) pushScore().catch(() => {});
}

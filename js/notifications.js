import { getSettings, updateSettings, getWords, todayXp, today } from "./store.js";
import { toast } from "./utils.js";

export const supported = () => "Notification" in window;
export const permission = () => (supported() ? Notification.permission : "unsupported");

// Turns reminders on; asks the browser for permission the first time.
export async function enableReminders() {
  if (!supported()) { toast("This browser doesn't support notifications"); return false; }
  const result = Notification.permission === "default"
    ? await Notification.requestPermission()
    : Notification.permission;
  if (result !== "granted") {
    toast("Notifications are blocked — allow them in your browser's site settings");
    return false;
  }
  updateSettings({ reminderEnabled: true });
  return true;
}

export const disableReminders = () => updateSettings({ reminderEnabled: false });

// Called every minute while the app is open. Sends at most one reminder per day,
// only after the chosen time, and only if there is something to practice.
export function checkReminder() {
  const s = getSettings();
  if (!s.reminderEnabled || permission() !== "granted") return;
  if (s.lastReminded === today() || todayXp() > 0) return;

  const [h, m] = s.reminderTime.split(":").map(Number);
  const now = new Date();
  if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;

  const due = getWords().filter((w) => w.nextReview <= Date.now()).length;
  if (!due) return;

  const n = new Notification("Time to practice 🦉", {
    body: `${due} word${due === 1 ? " is" : "s are"} due for review.`,
  });
  n.onclick = () => { window.focus(); location.hash = "#/quiz"; n.close(); };
  updateSettings({ lastReminded: today() });
}

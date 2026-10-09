import type { Priority, QueueType, Ticket } from "./types.js";
import { logout, requireAuth } from "./auth.js";
import { getQueueTypes, getTickets, saveTickets } from "./storage.js";
import { sortQueue } from "./tickets.js";

const SELECTED_KEY = "operatorQueue"; // only this page uses it
const POLL_MS = 2000;

const PRIORITY_LABEL: Record<Priority, string> = {
  normal: "Normal",
  lansia: "Lansia",
  disabilitas: "Disabilitas",
  vip: "VIP",
};

const session = requireAuth();

const userInfo = document.getElementById("user-info") as HTMLSpanElement;
const logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement;
const queueSelect = document.getElementById("queue-select") as HTMLSelectElement;
const currentEl = document.getElementById("current-ticket") as HTMLDivElement;
const currentMeta = document.getElementById("current-meta") as HTMLDivElement;
const nextEl = document.getElementById("next-ticket") as HTMLDivElement;
const waitingCount = document.getElementById("waiting-count") as HTMLSpanElement;
const waitingList = document.getElementById("waiting-list") as HTMLUListElement;
const nextBtn = document.getElementById("btn-next") as HTMLButtonElement;
const skipBtn = document.getElementById("btn-skip") as HTMLButtonElement;
const doneBtn = document.getElementById("btn-done") as HTMLButtonElement;
const messageEl = document.getElementById("message") as HTMLDivElement;

function selectedCode(): string {
  return queueSelect.value;
}

function renderQueueSelect(types: QueueType[]): void {
  const active = types.filter((t) => t.active);
  const saved = localStorage.getItem(SELECTED_KEY);
  const previous = queueSelect.value || saved || "";

  const sig = active.map((t) => `${t.code}:${t.name}`).join("|");
  if (queueSelect.dataset.sig !== sig) {
    queueSelect.replaceChildren(
      ...active.map((t) => {
        const opt = document.createElement("option");
        opt.value = t.code;
        opt.textContent = `${t.code} - ${t.name}`;
        return opt;
      }),
    );
    queueSelect.dataset.sig = sig;
  }
  if (active.some((t) => t.code === previous)) queueSelect.value = previous;
}

function showMessage(text: string): void {
  messageEl.textContent = text;
  messageEl.hidden = text === "";
}

function render(): void {
  renderQueueSelect(getQueueTypes());
  const code = selectedCode();

  if (!code) {
    currentEl.textContent = "-";
    currentMeta.textContent = "";
    nextEl.textContent = "-";
    waitingCount.textContent = "0";
    waitingList.replaceChildren();
    [nextBtn, skipBtn, doneBtn].forEach((b) => (b.disabled = true));
    showMessage("Belum ada jenis antrian aktif. Minta admin menambahkannya di dashboard.");
    return;
  }
  showMessage("");

  const mine = getTickets().filter((t) => t.code === code);
  const current = mine.find((t) => t.status === "called");
  const waiting = sortQueue(mine.filter((t) => t.status === "waiting"));

  currentEl.textContent = current ? current.id : "-";
  currentMeta.textContent = current ? PRIORITY_LABEL[current.priority] : "Belum ada tiket dipanggil";
  nextEl.textContent = waiting[0] ? waiting[0].id : "-";
  waitingCount.textContent = String(waiting.length);

  waitingList.replaceChildren(
    ...waiting.map((t) => {
      const li = document.createElement("li");
      const id = document.createElement("strong");
      id.textContent = t.id;
      const badge = document.createElement("span");
      badge.className = `badge ${t.priority}`;
      badge.textContent = PRIORITY_LABEL[t.priority];
      li.append(id, badge);
      return li;
    }),
  );

  nextBtn.disabled = waiting.length === 0 && !current;
  skipBtn.disabled = !current;
  doneBtn.disabled = !current;
}

// Re-reads tickets right before writing so changes made by other tabs are kept.
function update(code: string, change: (mine: Ticket[]) => void): void {
  const all = getTickets();
  change(all.filter((t) => t.code === code));
  saveTickets(all);
  render();
}

nextBtn.addEventListener("click", () => {
  update(selectedCode(), (mine) => {
    mine.filter((t) => t.status === "called").forEach((t) => (t.status = "done"));
    const next = sortQueue(mine.filter((t) => t.status === "waiting"))[0];
    if (next) next.status = "called";
  });
});

skipBtn.addEventListener("click", () => {
  update(selectedCode(), (mine) => {
    mine.filter((t) => t.status === "called").forEach((t) => (t.status = "skipped"));
  });
});

doneBtn.addEventListener("click", () => {
  update(selectedCode(), (mine) => {
    mine.filter((t) => t.status === "called").forEach((t) => (t.status = "done"));
  });
});

queueSelect.addEventListener("change", () => {
  try {
    localStorage.setItem(SELECTED_KEY, selectedCode());
  } catch {
    /* remembering the choice is optional */
  }
  render();
});

logoutBtn.addEventListener("click", logout);

if (session) {
  userInfo.textContent = `${session.firstName} (${session.role})`;
  render();
  window.addEventListener("storage", render);
  setInterval(render, POLL_MS);
}

import type { Priority, QueueType, Ticket, TicketStatus } from "./types.js";
import { isAdmin, logout, requireAuth } from "./auth.js";
import { getQueueTypes, getTickets, saveQueueTypes, saveTickets } from "./storage.js";
import { createTicket, resetQueue } from "./tickets.js";

const POLL_MS = 2000;
const MAX_RECENT_TICKETS = 15;

const PRIORITY_LABEL: Record<Priority, string> = {
  normal: "Normal",
  lansia: "Lansia",
  disabilitas: "Disabilitas",
  vip: "VIP",
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  waiting: "Menunggu",
  called: "Dipanggil",
  done: "Selesai",
  skipped: "Dilewati",
};

const STATUS_ORDER: TicketStatus[] = ["waiting", "called", "done", "skipped"];

// Menyempitkan string dari <select> menjadi Priority tanpa type assertion.
function isPriority(value: string): value is Priority {
  return value in PRIORITY_LABEL;
}

// Hanya admin/moderator yang boleh masuk. Selain itu requireAuth redirect ke login.html.
const session = requireAuth(isAdmin);

const userInfo = document.getElementById("user-info") as HTMLSpanElement;
const logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement;
const messageEl = document.getElementById("message") as HTMLDivElement;

const typeForm = document.getElementById("type-form") as HTMLFormElement;
const codeInput = document.getElementById("code-input") as HTMLInputElement;
const nameInput = document.getElementById("name-input") as HTMLInputElement;

const ticketForm = document.getElementById("ticket-form") as HTMLFormElement;
const ticketType = document.getElementById("ticket-type") as HTMLSelectElement;
const ticketPriority = document.getElementById("ticket-priority") as HTMLSelectElement;
const ticketSubmit = document.getElementById("ticket-submit") as HTMLButtonElement;

const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
const typeList = document.getElementById("type-list") as HTMLTableSectionElement;
const typeEmpty = document.getElementById("type-empty") as HTMLDivElement;
const ticketList = document.getElementById("ticket-list") as HTMLTableSectionElement;
const ticketEmpty = document.getElementById("ticket-empty") as HTMLDivElement;

const statEls: Record<TicketStatus, HTMLElement> = {
  waiting: document.getElementById("stat-waiting") as HTMLElement,
  called: document.getElementById("stat-called") as HTMLElement,
  done: document.getElementById("stat-done") as HTMLElement,
  skipped: document.getElementById("stat-skipped") as HTMLElement,
};

let messageTimer: number | undefined;

function showMessage(text: string, kind: "error" | "success"): void {
  window.clearTimeout(messageTimer);
  messageEl.textContent = text;
  messageEl.className = kind;
  messageEl.hidden = false;
  messageTimer = window.setTimeout(() => (messageEl.hidden = true), 5000);
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : "Terjadi kesalahan tidak dikenal";
}

// Hanya dibuat kalau key queueTypes belum pernah ada,
// jadi tidak muncul lagi setelah admin sengaja menghapus semuanya.
function seedDefaultTypes(): void {
  if (localStorage.getItem("queueTypes") !== null) return;
  saveQueueTypes([
    { code: "A", name: "Poli Umum", active: true, lastNumber: 0 },
    { code: "B", name: "Poli Gigi", active: true, lastNumber: 0 },
  ]);
}

function makeCell(content: string | Node): HTMLTableCellElement {
  const td = document.createElement("td");
  td.append(content);
  return td;
}

function makeBadge(text: string, className: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = `badge ${className}`;
  span.textContent = text;
  return span;
}

function makeButton(text: string, className: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `btn small ${className}`;
  btn.textContent = text;
  btn.addEventListener("click", onClick);
  return btn;
}

function renderStats(tickets: Ticket[]): void {
  for (const status of STATUS_ORDER) {
    statEls[status].textContent = String(tickets.filter((t) => t.status === status).length);
  }
}

function renderTypeList(types: QueueType[]): void {
  typeList.replaceChildren(
    ...types.map((t) => {
      const tr = document.createElement("tr");
      const code = document.createElement("strong");
      code.textContent = t.code;

      const actions = document.createElement("div");
      actions.className = "actions";
      actions.append(
        makeButton(t.active ? "Nonaktifkan" : "Aktifkan", t.active ? "amber" : "green", () =>
          toggleType(t.code),
        ),
        makeButton("Hapus", "red", () => deleteType(t.code)),
      );

      tr.append(
        makeCell(code),
        makeCell(t.name),
        makeCell(makeBadge(t.active ? "Aktif" : "Nonaktif", t.active ? "on" : "off")),
        makeCell(String(t.lastNumber)),
        makeCell(actions),
      );
      return tr;
    }),
  );
  typeEmpty.hidden = types.length > 0;
}

// Dropdown tiket manual hanya berisi jenis aktif. Dibangun ulang hanya jika isinya berubah
// supaya pilihan admin tidak ter-reset oleh polling.
function renderTicketTypeSelect(types: QueueType[]): void {
  const active = types.filter((t) => t.active);
  const sig = active.map((t) => `${t.code}:${t.name}`).join("|");
  if (ticketType.dataset.sig !== sig) {
    const previous = ticketType.value;
    ticketType.replaceChildren(
      ...active.map((t) => {
        const opt = document.createElement("option");
        opt.value = t.code;
        opt.textContent = `${t.code} - ${t.name}`;
        return opt;
      }),
    );
    ticketType.dataset.sig = sig;
    if (active.some((t) => t.code === previous)) ticketType.value = previous;
  }
  ticketSubmit.disabled = active.length === 0;
}

function renderTicketList(tickets: Ticket[]): void {
  const recent = [...tickets].sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_RECENT_TICKETS);
  ticketList.replaceChildren(
    ...recent.map((t) => {
      const tr = document.createElement("tr");
      const id = document.createElement("strong");
      id.textContent = t.id;
      tr.append(
        makeCell(id),
        makeCell(t.code),
        makeCell(makeBadge(PRIORITY_LABEL[t.priority], t.priority)),
        makeCell(makeBadge(STATUS_LABEL[t.status], t.status)),
        makeCell(new Date(t.createdAt).toLocaleTimeString("id-ID")),
      );
      return tr;
    }),
  );
  ticketEmpty.hidden = tickets.length > 0;
}

function render(): void {
  // Urutkan berdasarkan kode (A-Z) supaya daftar dan dropdown selalu rapi.
  const types = [...getQueueTypes()].sort((a, b) => a.code.localeCompare(b.code));
  const tickets = getTickets();
  renderStats(tickets);
  renderTypeList(types);
  renderTicketTypeSelect(types);
  renderTicketList(tickets);
}

// Kode wajib 1 huruf kapital, kode & nama tidak boleh kembar (case-insensitive).
function addType(codeRaw: string, nameRaw: string): void {
  const code = codeRaw.trim().toUpperCase();
  const name = nameRaw.trim().replace(/\s+/g, " ");

  if (!/^[A-Z]$/.test(code)) throw new Error("Kode harus tepat 1 huruf (A-Z).");
  if (name === "") throw new Error("Nama layanan wajib diisi.");

  const types = getQueueTypes();
  if (types.some((t) => t.code.toUpperCase() === code)) {
    throw new Error(`Kode "${code}" sudah dipakai jenis antrian lain.`);
  }
  if (types.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
    throw new Error(`Nama layanan "${name}" sudah ada.`);
  }

  saveQueueTypes([...types, { code, name, active: true, lastNumber: 0 }]);
}

function toggleType(code: string): void {
  const types = getQueueTypes(); // baca ulang agar perubahan halaman lain tidak tertimpa
  const type = types.find((t) => t.code === code);
  if (!type) return;
  type.active = !type.active;
  saveQueueTypes(types);
  showMessage(`Jenis ${code} ${type.active ? "diaktifkan" : "dinonaktifkan"}.`, "success");
  render();
}

function deleteType(code: string): void {
  const hasTickets = getTickets().some((t) => t.code === code);
  const warning = hasTickets
    ? `Hapus jenis antrian ${code}? Semua tiketnya juga akan dihapus.`
    : `Hapus jenis antrian ${code}?`;
  if (!window.confirm(warning)) return;

  saveQueueTypes(getQueueTypes().filter((t) => t.code !== code));
  saveTickets(getTickets().filter((t) => t.code !== code));
  showMessage(`Jenis antrian ${code} dihapus.`, "success");
  render();
}

typeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    addType(codeInput.value, nameInput.value);
    showMessage(`Jenis antrian ${codeInput.value.trim().toUpperCase()} berhasil ditambahkan.`, "success");
    typeForm.reset();
    codeInput.focus();
    render();
  } catch (err) {
    showMessage(errorText(err), "error");
  }
});

ticketForm.addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    if (ticketType.value === "") throw new Error("Pilih jenis antrian terlebih dahulu.");
    const priority = ticketPriority.value;
    if (!isPriority(priority)) throw new Error("Tingkat prioritas tidak valid.");
    const ticket = createTicket(ticketType.value, priority);
    showMessage(`Tiket ${ticket.id} (${PRIORITY_LABEL[ticket.priority]}) berhasil diterbitkan.`, "success");
    render();
  } catch (err) {
    showMessage(errorText(err), "error");
  }
});

resetBtn.addEventListener("click", () => {
  if (!window.confirm("Reset antrian? Semua tiket dihapus dan nomor kembali ke 001.")) return;
  resetQueue();
  showMessage("Antrian berhasil di-reset.", "success");
  render();
});

logoutBtn.addEventListener("click", logout);

if (session) {
  userInfo.textContent = `${session.firstName} (${session.role})`;
  seedDefaultTypes();
  render();
  // Halaman lain (operator, ambil antrian) mengubah tiket -> ikut ter-update.
  window.addEventListener("storage", render);
  setInterval(render, POLL_MS);
}

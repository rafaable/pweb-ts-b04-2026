import { getQueueTypes, saveQueueTypes } from "./storage.js";
import { createTicket } from "./tickets.js";
const DEFAULT_TYPES = [
    { code: "A", name: "UMUM-1", active: true, lastNumber: 0 },
    { code: "B", name: "UMUM-2", active: true, lastNumber: 0 },
    { code: "C", name: "UMUM-3", active: true, lastNumber: 0 },
    { code: "G", name: "GIGI", active: true, lastNumber: 0 },
    { code: "F", name: "FARMASI", active: true, lastNumber: 0 },
    { code: "P", name: "PSIKOLOG", active: true, lastNumber: 0 },
];
const PRIORITY_LABELS = {
    normal: "Normal",
    lansia: "Lansia",
    disabilitas: "Disabilitas",
    vip: "VIP",
};
// Inisialisasi jenis antrian awal jika Local Storage masih kosong
function ensureInitialQueueTypes() {
    const current = getQueueTypes();
    if (!current || current.length === 0) {
        saveQueueTypes(DEFAULT_TYPES);
    }
}
// Menampilkan nama pengguna yang sedang aktif
function displayUserGreeting() {
    let firstName = localStorage.getItem("firstName");
    if (!firstName) {
        try {
            const session = JSON.parse(localStorage.getItem("session") || "null");
            if (session && session.firstName)
                firstName = session.firstName;
        }
        catch {
            /* abaikan */
        }
    }
    const greetingEl = document.getElementById("user-greeting");
    if (greetingEl && firstName) {
        greetingEl.textContent = firstName;
    }
}
// Logout pengguna
export function logoutUser() {
    localStorage.removeItem("firstName");
    localStorage.removeItem("session");
    window.location.replace("login.html");
}
// Kontrol Modal Popup
export function showModal(title, htmlMessage) {
    const overlay = document.getElementById("modalOverlay");
    const msg = document.getElementById("modalMessage");
    const titleEl = overlay?.querySelector("h3");
    if (titleEl)
        titleEl.textContent = title;
    if (msg)
        msg.innerHTML = htmlMessage;
    if (overlay)
        overlay.classList.add("show");
}
export function closeModal() {
    const overlay = document.getElementById("modalOverlay");
    if (overlay)
        overlay.classList.remove("show");
}
// Kontrol Fullscreen
export function updateFullscreenBtn() {
    const btn = document.getElementById("fullscreen-btn");
    if (!btn)
        return;
    btn.textContent = document.fullscreenElement ? "Keluar layar penuh" : "Layar penuh";
}
export function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(updateFullscreenBtn).catch((err) => {
            alert(`Gagal masuk ke mode layar penuh: ${err.message}`);
        });
    }
    else {
        if (document.exitFullscreen) {
            document.exitFullscreen().then(updateFullscreenBtn).catch(() => { });
        }
    }
}
// Render kartu jenis antrian secara dinamis
function renderCards() {
    const grid = document.querySelector(".cards-grid");
    if (!grid)
        return;
    const types = getQueueTypes().filter((t) => t.active);
    const sig = types.map((t) => `${t.code}:${t.name}`).join("|");
    // Jika struktur jenis antrian tidak berubah, kita pertahankan elemen agar pilihan dropdown tidak ter-reset
    if (grid.getAttribute("data-sig") === sig) {
        return;
    }
    grid.setAttribute("data-sig", sig);
    if (types.length === 0) {
        grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; background: #fff; border-radius: 12px; border: 1px dashed var(--muted-teal);">
        <p style="font-size: 1.1rem; color: var(--charcoal); font-weight: 600;">Belum ada jenis antrian aktif</p>
        <p style="color: var(--cool-gray); font-size: 0.9rem; margin-top: 0.5rem;">Silakan aktifkan atau tambahkan jenis antrian di dashboard admin.</p>
      </div>
    `;
        return;
    }
    grid.innerHTML = "";
    types.forEach((type) => {
        const card = document.createElement("div");
        card.className = "card";
        const topSection = document.createElement("div");
        const header = document.createElement("div");
        header.className = "card-header";
        const title = document.createElement("span");
        title.className = "card-title";
        title.textContent = type.name;
        const badge = document.createElement("span");
        badge.className = "card-badge";
        badge.textContent = type.code;
        header.append(title, badge);
        const prioritySec = document.createElement("div");
        prioritySec.className = "priority-section";
        const label = document.createElement("label");
        label.className = "priority-label";
        label.htmlFor = `priority-${type.code}`;
        label.textContent = "Pilih prioritas:";
        const select = document.createElement("select");
        select.className = "priority-select";
        select.id = `priority-${type.code}`;
        const options = ["normal", "lansia", "disabilitas", "vip"];
        options.forEach((opt) => {
            const optionEl = document.createElement("option");
            optionEl.value = opt;
            optionEl.textContent = PRIORITY_LABELS[opt];
            if (opt === "normal")
                optionEl.selected = true;
            select.appendChild(optionEl);
        });
        prioritySec.append(label, select);
        topSection.append(header, prioritySec);
        const btn = document.createElement("button");
        btn.className = "btn-ambil";
        btn.textContent = "Ambil Nomor";
        btn.addEventListener("click", () => {
            handleAmbilNomor(type.code, type.name, select.value);
        });
        card.append(topSection, btn);
        grid.appendChild(card);
    });
}
// Menangani pengambilan nomor tiket
function handleAmbilNomor(code, name, priority) {
    try {
        const ticket = createTicket(code, priority);
        const priorityLabel = PRIORITY_LABELS[priority] || "Normal";
        showModal("Nomor Berhasil Diambil", `Nomor antrian <strong>${ticket.id}</strong> untuk layanan <strong>${name}</strong> berhasil diambil dengan prioritas: <strong>${priorityLabel}</strong>.<br><br>Silakan menunggu nomor panggilan Anda.`);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Terjadi kesalahan saat mengambil tiket";
        showModal("Gagal Mengambil Nomor", `<span style="color: #dc2626;">${message}</span>`);
    }
}
// Format tanggal di footer
function updateFooterDate() {
    const footerEl = document.getElementById("footer-text");
    if (!footerEl)
        return;
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    footerEl.innerText = `Jenis antrian baru muncul otomatis. Data: ${day}.${month}.${year}`;
}
window.logoutUser = logoutUser;
window.toggleFullscreen = toggleFullscreen;
window.closeModal = closeModal;
// Inisialisasi halaman saat dimuat
document.addEventListener("DOMContentLoaded", () => {
    ensureInitialQueueTypes();
    displayUserGreeting();
    updateFooterDate();
    renderCards();
    // Polling data jenis antrian setiap 2 detik
    setInterval(renderCards, 2000);
    // Dengarkan event storage untuk sinkronisasi antar tab
    window.addEventListener("storage", renderCards);
    // Fullscreen change listener
    document.addEventListener("fullscreenchange", updateFullscreenBtn);
    // Tombol modal close
    const modalCloseBtn = document.querySelector(".modal-btn");
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener("click", closeModal);
    }
});

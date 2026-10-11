import { getQueueTypes, getTickets, saveQueueTypes } from "./storage.js";
const DEFAULT_TYPES = [
    { code: "A", name: "UMUM-1", active: true, lastNumber: 0 },
    { code: "B", name: "UMUM-2", active: true, lastNumber: 0 },
    { code: "C", name: "UMUM-3", active: true, lastNumber: 0 },
    { code: "G", name: "GIGI", active: true, lastNumber: 0 },
    { code: "F", name: "FARMASI", active: true, lastNumber: 0 },
    { code: "P", name: "PSIKOLOG", active: true, lastNumber: 0 },
];
// Riwayat tiket yang sedang dipanggil untuk deteksi panggilan baru (audio)
const lastCalledTickets = new Map();
let isInitialLoad = true;
// Inisialisasi jenis antrian awal jika belum ada
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
// Update jam digital di layar secara real-time
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const timeString = `${hours}.${minutes}.${seconds}`;
    const timeEl = document.getElementById("tanggal-reload-layar");
    if (timeEl) {
        timeEl.textContent = timeString;
    }
}
// Fitur Bonus: Suara audio panggilan tiket menggunakan Web Speech API (bahasa Indonesia)
function announceTicket(ticketId, serviceName) {
    if (!("speechSynthesis" in window))
        return;
    try {
        window.speechSynthesis.cancel();
        // Pisahkan kode dan nomor, misal "A 001" agar pelafalan jelas
        const letters = ticketId.replace("-", " ");
        const text = `Nomor antrian, ${letters}, silakan menuju ${serviceName}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "id-ID";
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
    catch {
        /* browser autoplay restriction */
    }
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
// Render kartu antrian pada layar
function renderScreen() {
    const grid = document.querySelector(".cards-grid");
    if (!grid)
        return;
    const types = getQueueTypes().filter((t) => t.active);
    const tickets = getTickets();
    // Signature data untuk efisiensi render
    const sigParts = [];
    types.forEach((type) => {
        const called = tickets.find((t) => t.code === type.code && t.status === "called");
        const waitCount = tickets.filter((t) => t.code === type.code && t.status === "waiting").length;
        sigParts.push(`${type.code}:${type.name}:${called ? called.id : "none"}:${waitCount}`);
    });
    const currentSig = sigParts.join("|");
    if (grid.getAttribute("data-sig") === currentSig) {
        return;
    }
    grid.setAttribute("data-sig", currentSig);
    if (types.length === 0) {
        grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: #fff; border-radius: 12px; border: 1px dashed var(--muted-teal);">
        <p style="font-size: 1.2rem; color: var(--charcoal); font-weight: 600;">Belum ada jenis antrian aktif</p>
        <p style="color: var(--cool-gray); font-size: 0.95rem; margin-top: 0.5rem;">Antrian akan ditampilkan setelah admin mengaktifkan jenis antrian di dashboard.</p>
      </div>
    `;
        return;
    }
    grid.innerHTML = "";
    types.forEach((type) => {
        const calledTicket = tickets.find((t) => t.code === type.code && t.status === "called");
        const waitingTickets = tickets.filter((t) => t.code === type.code && t.status === "waiting");
        // Deteksi nomor tiket baru yang dipanggil untuk audio panggilan suara
        if (calledTicket) {
            const prevCalled = lastCalledTickets.get(type.code);
            if (prevCalled !== calledTicket.id) {
                lastCalledTickets.set(type.code, calledTicket.id);
                if (!isInitialLoad) {
                    announceTicket(calledTicket.id, type.name);
                }
            }
        }
        else {
            lastCalledTickets.delete(type.code);
        }
        const card = document.createElement("div");
        card.className = "card";
        // Header kartu
        const header = document.createElement("div");
        header.className = "card-header";
        const title = document.createElement("span");
        title.className = "card-title";
        title.textContent = type.name;
        const badge = document.createElement("span");
        badge.className = "card-badge";
        badge.textContent = type.code;
        header.append(title, badge);
        // Konten kartu
        const content = document.createElement("div");
        content.className = "card-content";
        if (calledTicket) {
            const statusIndicator = document.createElement("div");
            statusIndicator.className = "status-indicator";
            const dot = document.createElement("span");
            dot.className = "status-dot";
            statusIndicator.append(dot, document.createTextNode(" DIPANGGIL"));
            const ticketNumber = document.createElement("div");
            ticketNumber.className = "ticket-number";
            ticketNumber.textContent = calledTicket.id;
            content.append(statusIndicator, ticketNumber);
        }
        else {
            const emptyStatus = document.createElement("div");
            emptyStatus.className = "empty-status";
            emptyStatus.textContent = "Belum ada nomor dipanggil";
            const emptySubtext = document.createElement("div");
            emptySubtext.className = "empty-subtext";
            emptySubtext.textContent = "Nomor akan muncul setelah operator memanggil tiket.";
            content.append(emptyStatus, emptySubtext);
        }
        // Footer kartu
        const footer = document.createElement("div");
        footer.className = "waiting-count";
        footer.textContent = `${waitingTickets.length} tiket menunggu`;
        card.append(header, content, footer);
        grid.appendChild(card);
    });
    isInitialLoad = false;
}
window.logoutUser = logoutUser;
window.toggleFullscreen = toggleFullscreen;
// Inisialisasi saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
    ensureInitialQueueTypes();
    displayUserGreeting();
    updateClock();
    setInterval(updateClock, 1000);
    renderScreen();
    // Polling data antrian setiap 2 detik sesuai ketentuan soal
    setInterval(renderScreen, 2000);
    // Sinkronisasi real-time antar tab saat Local Storage berubah
    window.addEventListener("storage", renderScreen);
    // Fullscreen change listener
    document.addEventListener("fullscreenchange", updateFullscreenBtn);
});

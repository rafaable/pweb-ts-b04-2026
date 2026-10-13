import { isAdmin, login, logout } from "./auth.js";
import { clearSession, getSession } from "./storage.js";
const form = document.getElementById("login-form");
const notice = document.getElementById("session-notice");
const noticeText = document.getElementById("session-text");
const continueBtn = document.getElementById("continue-btn");
const switchBtn = document.getElementById("switch-btn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submit-btn");
const errorBox = document.getElementById("error");
function redirectByRole(role) {
    window.location.replace(isAdmin(role) ? "index.html" : "ambil-antrian.html");
}
function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.classList.toggle("loading", loading);
    submitBtn.textContent = loading ? "Memverifikasi..." : "Masuk";
}
function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
}
// already logged in: offer to continue or log out instead of showing the form
const existing = getSession();
if (existing) {
    noticeText.textContent = `Anda sudah masuk sebagai ${existing.firstName} (${existing.role}).`;
    notice.hidden = false;
    form.hidden = true;
    continueBtn.addEventListener("click", () => redirectByRole(existing.role));
    switchBtn.addEventListener("click", () => {
        logout();
        window.location.reload();
    });
}
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.hidden = true;
    setLoading(true);
    try {
        // 1. User login
        const session = await login(usernameInput.value.trim(), passwordInput.value);
        // 2. Ambil firstName
        const firstName = session.firstName;
        const role = session.role;
        // 3. Validasi role: Izinkan admin, moderator, atau user
        if (role !== "admin" && role !== "moderator" && role !== "user") {
            clearSession();
            localStorage.removeItem("firstName");
            showError("Role pengguna tidak dikenali");
            setLoading(false);
            return;
        }
        // 4. Simpan firstName dan arahkan sesuai role (Admin/Moderator ke index.html, User ke ambil-antrian.html)
        localStorage.setItem("firstName", firstName);
        redirectByRole(role);
    }
    catch (err) {
        showError(err instanceof TypeError
            ? "Koneksi jaringan gagal. Periksa internet Anda."
            : err instanceof Error
                ? err.message
                : "Terjadi kesalahan");
        setLoading(false);
    }
});

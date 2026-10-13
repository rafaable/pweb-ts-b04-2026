import type { Role } from "./types.js";
import { isAdmin, login, logout } from "./auth.js";
import { clearSession, getSession } from "./storage.js";

const form = document.getElementById("login-form") as HTMLFormElement;
const notice = document.getElementById("session-notice") as HTMLDivElement;
const noticeText = document.getElementById("session-text") as HTMLParagraphElement;
const continueBtn = document.getElementById("continue-btn") as HTMLButtonElement;
const switchBtn = document.getElementById("switch-btn") as HTMLButtonElement;
const usernameInput = document.getElementById("username") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
const errorBox = document.getElementById("error") as HTMLDivElement;

function redirectByRole(role: Role): void {
  window.location.replace(isAdmin(role) ? "index.html" : "ambil-antrian.html");
}

function setLoading(loading: boolean): void {
  submitBtn.disabled = loading;
  submitBtn.classList.toggle("loading", loading);
  submitBtn.textContent = loading ? "Memverifikasi..." : "Masuk";
}

function showError(message: string): void {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

// already logged in: offer to continue or log out instead of showing the form
const existing = getSession();
if (existing) {
  noticeText.textContent = `Anda sudah masuk sebagai ${existing.firstName} (${existing.role}).`;
  notice.hidden = false;
  form.hidden = true;
  continueBtn.addEventListener("click", () => redirectByRole(existing.role as Role));
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
    const role = session.role as Role;

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

  } catch (err) {
    showError(
      err instanceof TypeError
        ? "Koneksi jaringan gagal. Periksa internet Anda."
        : err instanceof Error
          ? err.message
          : "Terjadi kesalahan",
    );
    setLoading(false);
  }
});
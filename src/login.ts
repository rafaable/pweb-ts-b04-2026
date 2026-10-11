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
  if (existing.role !== "user") {
    clearSession();
    localStorage.removeItem("firstName");
  } else {
    noticeText.textContent = `Anda sudah masuk sebagai ${existing.firstName} (${existing.role}).`;
    notice.hidden = false;
    form.hidden = true;
    continueBtn.addEventListener("click", () => window.location.replace("ambil-antrian.html"));
    switchBtn.addEventListener("click", logout);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.hidden = true;
  setLoading(true);
  try {
    // 1. User login
    const session = await login(usernameInput.value.trim(), passwordInput.value);

    // 2. Cari firstName
    const firstName = session.firstName;

    // 3. Berdasarkan firstName, cek role di json bersesuaian sesuai firstName nya
    const filterRes = await fetch("https://dummyjson.com/users/filter?key=role&value=user");
    const filterData = await filterRes.json();
    let users: Array<{ firstName: string; role: string }> = filterData.users || [];

    let matchedUser = users.find(
      (u) => u.firstName.toLowerCase() === firstName.toLowerCase()
    );

    if (!matchedUser && filterData.total > users.length) {
      const allRes = await fetch("https://dummyjson.com/users/filter?key=role&value=user&limit=0");
      const allData = await allRes.json();
      users = allData.users || [];
      matchedUser = users.find(
        (u) => u.firstName.toLowerCase() === firstName.toLowerCase()
      );
    }

    // 4. Kalau rolenya bukan "user", gaboleh masuk dan tampilkan error
    if (session.role !== "user" || !matchedUser || matchedUser.role !== "user") {
      clearSession();
      localStorage.removeItem("firstName");
      showError("user nggak tersedia");
      setLoading(false);
      return;
    }

    localStorage.setItem("firstName", firstName);
    window.location.replace("ambil-antrian.html");
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

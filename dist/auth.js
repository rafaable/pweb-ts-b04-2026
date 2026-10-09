import { clearSession, getSession, saveSession } from "./storage.js";
const LOGIN_URL = "https://dummyjson.com/auth/login";
const ME_URL = "https://dummyjson.com/auth/me";
// moderator has the same rights as admin
export function isAdmin(role) {
    return role === "admin" || role === "moderator";
}
// Throws Error(message) on bad credentials or network failure.
export async function login(username, password) {
    const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    const data = (await res.json());
    if (!res.ok)
        throw new Error(data.message ?? "Login gagal");
    const token = data.accessToken;
    if (!token || !data.firstName)
        throw new Error("Respons server tidak lengkap");
    const meRes = await fetch(ME_URL, { headers: { Authorization: `Bearer ${token}` } });
    const me = (await meRes.json());
    if (!meRes.ok || !me.role)
        throw new Error(me.message ?? "Gagal mengambil role pengguna");
    const session = { token, role: me.role, firstName: data.firstName };
    saveSession(session);
    return session;
}
// Returns the session, or redirects to login.html and returns null.
export function requireAuth(allowed) {
    const session = getSession();
    if (!session || (allowed && !allowed(session.role))) {
        window.location.replace("login.html");
        return null;
    }
    return session;
}
export function logout() {
    clearSession();
    window.location.replace("login.html");
}

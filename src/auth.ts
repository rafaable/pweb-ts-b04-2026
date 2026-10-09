import type { Role, Session } from "./types.js";
import { clearSession, getSession, saveSession } from "./storage.js";

const LOGIN_URL = "https://dummyjson.com/auth/login";
const ME_URL = "https://dummyjson.com/auth/me";

interface LoginResponse {
  accessToken?: string;
  firstName?: string;
  message?: string;
}

// the login response has no role, so it comes from /auth/me
interface MeResponse {
  role?: Role;
  message?: string;
}

// moderator has the same rights as admin
export function isAdmin(role: Role): boolean {
  return role === "admin" || role === "moderator";
}

// Throws Error(message) on bad credentials or network failure.
export async function login(username: string, password: string): Promise<Session> {
  const res = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = (await res.json()) as LoginResponse;
  if (!res.ok) throw new Error(data.message ?? "Login gagal");

  const token = data.accessToken;
  if (!token || !data.firstName) throw new Error("Respons server tidak lengkap");

  const meRes = await fetch(ME_URL, { headers: { Authorization: `Bearer ${token}` } });
  const me = (await meRes.json()) as MeResponse;
  if (!meRes.ok || !me.role) throw new Error(me.message ?? "Gagal mengambil role pengguna");

  const session: Session = { token, role: me.role, firstName: data.firstName };
  saveSession(session);
  return session;
}

// Returns the session, or redirects to login.html and returns null.
export function requireAuth(allowed?: (role: Role) => boolean): Session | null {
  const session = getSession();
  if (!session || (allowed && !allowed(session.role))) {
    window.location.replace("login.html");
    return null;
  }
  return session;
}

export function logout(): void {
  clearSession();
  window.location.replace("login.html");
}

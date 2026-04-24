/**
 * Simple frontend auth. Replace with real provider later.
 */
const AUTH_KEY = "wellness_auth";

const VALID_USER = "admin";
const VALID_PASS = "wellness2026";

export interface AuthSession {
  user: string;
  loggedAt: string;
}

export const authService = {
  login(user: string, pass: string): AuthSession | null {
    if (user.trim() === VALID_USER && pass === VALID_PASS) {
      const session: AuthSession = { user, loggedAt: new Date().toISOString() };
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      return session;
    }
    return null;
  },
  logout(): void {
    localStorage.removeItem(AUTH_KEY);
  },
  current(): AuthSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  },
};
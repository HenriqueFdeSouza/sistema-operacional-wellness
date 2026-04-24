import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService, type AuthSession } from "@/services/auth";

interface AuthContextValue {
  session: AuthSession | null;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  ready: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(authService.current());
    setReady(true);
  }, []);

  const login = useCallback((user: string, pass: string) => {
    const s = authService.login(user, pass);
    if (s) {
      setSession(s);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, login, logout, ready }), [session, login, logout, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
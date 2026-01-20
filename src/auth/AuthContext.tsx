import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../api/client";
import type { AuthState, User } from "./types";
import { setAccessToken as setToken } from "./tokenStore";

type AuthCtx = {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  has: (perm: string) => boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ refresh-on-401 (single retry) + refresh lock + prevent loops
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let refreshPromise: Promise<any> | null = null;

    const id = api.interceptors.response.use(
      (r) => r,
      async (err) => {
        const original = err.config || {};
        const status = err.response?.status;

        const url: string = original?.url ?? "";
        const isAuthEndpoint =
          url.includes("/auth/login") ||
          url.includes("/auth/refresh") ||
          url.includes("/auth/logout");

        if (status === 401 && isAuthEndpoint) throw err;

        if (status === 401 && !original.__retried) {
          original.__retried = true;

          try {
            if (!refreshPromise) {
              refreshPromise = api.post("/auth/refresh").finally(() => {
                refreshPromise = null;
              });
            }

            const rr = await refreshPromise;

            setToken(rr.data.accessToken);
            setAccessToken(rr.data.accessToken);
            setUser(rr.data.user);

            return api(original);
          } catch {
            setToken(null);
            setAccessToken(null);
            setUser(null);
          }
        }

        throw err;
      },
    );

    return () => api.interceptors.response.eject(id);
  }, []);

  async function loadMe() {
    try {
      const rr = await api.post("/auth/refresh");

      setToken(rr.data.accessToken);
      setAccessToken(rr.data.accessToken);
      setUser(rr.data.user);
    } catch {
      setToken(null);
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function login(email: string, password: string) {
    const r = await api.post("/auth/login", { email, password });

    setToken(r.data.accessToken);
    setAccessToken(r.data.accessToken);
    setUser(r.data.user);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      setToken(null);
      setAccessToken(null);
      setUser(null);
    }
  }

  function has(perm: string) {
    return !!user?.role?.permissions?.includes(perm);
  }

  const value = useMemo<AuthCtx>(
    () => ({ state: { accessToken, user, loading }, login, logout, has }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accessToken, user, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}

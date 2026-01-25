/* eslint-disable react-hooks/exhaustive-deps */
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

type LoadProgress = {
  step: number; // current step (0..total)
  total: number; // total steps
  percent: number; // 0..100
  label: string; // what is happening now
};

type AuthCtx = {
  state: AuthState & { progress: LoadProgress };
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  has: (perm: string) => boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

const DEFAULT_PROGRESS: LoadProgress = {
  step: 0,
  total: 2,
  percent: 0,
  label: "Starting",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<LoadProgress>(DEFAULT_PROGRESS);

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
            // (optional) show progress during background refresh too
            setProgress({
              step: 1,
              total: 2,
              percent: 50,
              label: "Refreshing session (401)",
            });

            if (!refreshPromise) {
              refreshPromise = api.post("/auth/refresh").finally(() => {
                refreshPromise = null;
              });
            }

            const rr = await refreshPromise;

            setToken(rr.data.accessToken);
            setAccessToken(rr.data.accessToken);
            setUser(rr.data.user);

            setProgress({
              step: 2,
              total: 2,
              percent: 100,
              label: "Session refreshed",
            });

            return api(original);
          } catch {
            setToken(null);
            setAccessToken(null);
            setUser(null);

            setProgress({
              step: 2,
              total: 2,
              percent: 100,
              label: "Session expired",
            });
          }
        }

        throw err;
      },
    );

    return () => api.interceptors.response.eject(id);
  }, []);

  async function loadMe() {
    setLoading(true);
    setProgress({
      step: 1,
      total: 2,
      percent: 50,
      label: "Refreshing session",
    });

    try {
      const rr = await api.post("/auth/refresh");

      setProgress({
        step: 2,
        total: 2,
        percent: 100,
        label: "Loading user",
      });

      setToken(rr.data.accessToken);
      setAccessToken(rr.data.accessToken);
      setUser(rr.data.user);

      setProgress({
        step: 2,
        total: 2,
        percent: 100,
        label: "Ready",
      });
    } catch {
      setToken(null);
      setAccessToken(null);
      setUser(null);

      setProgress({
        step: 2,
        total: 2,
        percent: 100,
        label: "Not logged in",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function login(email: string, password: string) {
    setLoading(true);
    setProgress({
      step: 1,
      total: 2,
      percent: 50,
      label: "Logging in",
    });

    try {
      const r = await api.post("/auth/login", { email, password });

      setToken(r.data.accessToken);
      setAccessToken(r.data.accessToken);
      setUser(r.data.user);

      setProgress({
        step: 2,
        total: 2,
        percent: 100,
        label: "Logged in",
      });
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    setProgress({
      step: 1,
      total: 2,
      percent: 50,
      label: "Logging out",
    });

    try {
      await api.post("/auth/logout");
    } finally {
      setToken(null);
      setAccessToken(null);
      setUser(null);

      setProgress({
        step: 2,
        total: 2,
        percent: 100,
        label: "Logged out",
      });

      setLoading(false);
    }
  }

  function has(perm: string) {
    return !!user?.role?.permissions?.includes(perm);
  }

  const value = useMemo<AuthCtx>(
    () => ({
      state: { accessToken, user, loading, progress },
      login,
      logout,
      has,
    }),
    [accessToken, user, loading, progress],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}

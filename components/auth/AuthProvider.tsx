"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type AuthUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
  emailVerified: boolean;
} | null;

type AuthContextValue = {
  user: AuthUser;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Refresh proactively before the 1-hour access token expires. */
const REFRESH_INTERVAL_MS = 50 * 60 * 1000;
/** Grace window matching the server's refresh-race handling. */
const RACE_RETRY_DELAY_MS = 350;

async function callRefresh(retryOnRace = true): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "same-origin",
    });

    if (res.ok) return true;

    if (retryOnRace) {
      const data = (await res.json().catch(() => ({}))) as {
        code?: string;
      };
      if (data.code === "REFRESH_IN_PROGRESS") {
        await new Promise((resolve) =>
          setTimeout(resolve, RACE_RETRY_DELAY_MS),
        );
        return callRefresh(false);
      }
    }

    return false;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  // Coalesce refresh calls made from the timer, focus and 401 handling in this
  // tab. Other tabs are covered by the server's short race window.
  const refreshInFlight = useRef<Promise<boolean> | null>(null);

  const ensureRefresh = useCallback((): Promise<boolean> => {
    if (!refreshInFlight.current) {
      refreshInFlight.current = callRefresh().finally(() => {
        refreshInFlight.current = null;
      });
    }
    return refreshInFlight.current;
  }, []);

  const loadUser = useCallback(async () => {
    try {
      let res = await fetch("/api/auth/me", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (res.status === 401) {
        const refreshed = await ensureRefresh();
        if (!refreshed) {
          setUser(null);
          return;
        }
        res = await fetch("/api/auth/me", {
          credentials: "same-origin",
          cache: "no-store",
        });
      }

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [ensureRefresh]);

  const refresh = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Load the session once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  // Keep the short-lived access cookie alive while the app is open. The refresh
  // cookie (30 days) is only sent to /api/auth, so this is also the route that
  // renews it after the access token expires.
  useEffect(() => {
    if (!user) return;

    const timer = window.setInterval(() => {
      void ensureRefresh().then((ok) => {
        if (!ok) setUser(null);
      });
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [user, ensureRefresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

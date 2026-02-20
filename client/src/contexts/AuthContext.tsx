import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getToken, setToken as saveToken, clearToken, apiGet, apiPost, apiPut } from "@/lib/api";

export interface User {
  userID: number;
  name: string;
  email: string;
  role: string;
  userTypes: string | null;
  nickname: string | null;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
  updateProfile: (nickname: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const u = await apiGet<User>("/users/me");
      setUser(u);
    } catch {
      clearToken();
      setTokenState(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiPost<{ token: string }>("/auth/login", { email, password });
      if (res?.token) {
        saveToken(res.token);
        setTokenState(res.token);
        await loadUser();
      }
    },
    [loadUser]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await apiPost("/auth/register", { name, email, password });
      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const setToken = useCallback((t: string) => {
    saveToken(t);
    setTokenState(t);
    loadUser();
  }, [loadUser]);

  const updateProfile = useCallback(
    async (nickname: string) => {
      await apiPut("/users/me", { nickname });
      await loadUser(); // refresh user data
    },
    [loadUser]
  );

  const value = useMemo(
    () => ({ user, token, isLoading, login, register, logout, setToken, updateProfile }),
    [user, token, isLoading, login, register, logout, setToken, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

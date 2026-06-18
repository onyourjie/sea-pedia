import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  username: string;
  email: string;
  activeRole: string | null;
  roles: string[];
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  setActiveRole: (role: string, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        if (typeof window !== "undefined") localStorage.setItem("seapedia_token", token);
        set({ user, token });
      },
      setActiveRole: (role, token) => {
        if (typeof window !== "undefined") localStorage.setItem("seapedia_token", token);
        set((s) => ({ token, user: s.user ? { ...s.user, activeRole: role } : null }));
      },
      logout: () => {
        if (typeof window !== "undefined") localStorage.removeItem("seapedia_token");
        set({ user: null, token: null });
      },
    }),
    { name: "seapedia_auth" }
  )
);

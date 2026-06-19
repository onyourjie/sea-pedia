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
  hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  setActiveRole: (role: string, token: string) => void;
  logout: () => Promise<void>;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      hasHydrated: false,
      setAuth: (user, token) => {
        if (typeof window !== "undefined") localStorage.setItem("seapedia_token", token);
        set({ user, token });
      },
      setActiveRole: (role, token) => {
        if (typeof window !== "undefined") localStorage.setItem("seapedia_token", token);
        set((s) => ({ token, user: s.user ? { ...s.user, activeRole: role } : null }));
      },
      logout: async () => {
        const token = get().token;
        if (token) {
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
            await fetch(`${apiUrl}/auth/logout`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch {
            // Proceed with local logout even if API call fails
          }
        }
        if (typeof window !== "undefined") localStorage.removeItem("seapedia_token");
        set({ user: null, token: null });
      },
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "seapedia_auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

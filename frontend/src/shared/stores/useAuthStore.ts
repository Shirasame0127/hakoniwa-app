import { create } from "zustand";
import { persist, StorageValue } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;

  // Actions
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      loading: false,
      isLoggedIn: false,

      setToken: (token: string) => set({ token, isLoggedIn: !!token }),
      setUser: (user: User) => set({ user }),
      setLoading: (loading: boolean) => set({ loading }),
      logout: () =>
        set({
          token: null,
          user: null,
          isLoggedIn: false,
          loading: false,
        }),
      hydrate: () => {
        // localStorage から自動復元（persist middleware が処理）
      },
    }),
    {
      name: "auth-storage",
      storage: {
        getItem: (name: string) => {
          if (typeof window === "undefined") return null;
          const item = window.localStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name: string, value: StorageValue<AuthState>) => {
          if (typeof window === "undefined") return;
          window.localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name: string) => {
          if (typeof window === "undefined") return;
          window.localStorage.removeItem(name);
        },
      },
    }
  )
);

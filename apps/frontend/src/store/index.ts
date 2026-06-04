import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  isHydrated: boolean;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  accessToken: string | null;
  setAuth: (
    isAuthenticated: boolean,
    userId: string | null,
    email: string | null,
    displayName: string | null,
    accessToken?: string | null
  ) => void;
  setHydrated: (hydrated: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isHydrated: false,
  userId: null,
  email: null,
  displayName: null,
  accessToken: null,
  setAuth: (isAuthenticated, userId, email, displayName, accessToken = null) =>
    set({ isAuthenticated, userId, email, displayName, accessToken, isHydrated: true }),
  setHydrated: (hydrated) => set({ isHydrated: hydrated }),
  clearAuth: () =>
    set({
      isAuthenticated: false,
      isHydrated: true,
      userId: null,
      email: null,
      displayName: null,
      accessToken: null,
    }),
}));

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  }
  return 'light'; // lavender white blend as requested
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  theme: getInitialTheme(),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: nextTheme };
    });
  },
}));

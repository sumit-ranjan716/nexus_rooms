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
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));

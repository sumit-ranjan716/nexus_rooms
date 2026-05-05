import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  setAuth: (
    isAuthenticated: boolean,
    userId: string | null,
    email: string | null,
    displayName: string | null
  ) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userId: null,
  email: null,
  displayName: null,
  setAuth: (isAuthenticated, userId, email, displayName) =>
    set({ isAuthenticated, userId, email, displayName }),
  clearAuth: () =>
    set({
      isAuthenticated: false,
      userId: null,
      email: null,
      displayName: null,
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

import { create } from "zustand";
import { api } from "../services/api";

export const useAuthStore = create((set) => ({
  user: (() => {
    try {
      return JSON.parse(localStorage.getItem("ems.user") || "null");
    } catch {
      return null;
    }
  })(),
  isBooting: true,

  setUser: (user) => {
    if (user) {
      localStorage.setItem("ems.user", JSON.stringify(user));
    } else {
      localStorage.removeItem("ems.user");
    }
    set({ user });
  },

  checkSession: async () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      set({ isBooting: false });
      return;
    }
    try {
      const profile = await api.profile();
      set((state) => ({
        user: { ...state.user, id: profile.userId || state.user?.id, role: profile.role || state.user?.role },
      }));
    } catch {
      localStorage.removeItem("ems.user");
      set({ user: null });
    } finally {
      set({ isBooting: false });
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {
      
    }
    localStorage.removeItem("ems.user");
    set({ user: null });
  },
}));

// store/settings.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';
export type AppLang = 'en' | 'ar';

interface SettingsState {
  theme: ThemeMode;
  lang: AppLang;
  toggleTheme: () => void;
  toggleLang: () => void;
  setTheme: (theme: ThemeMode) => void;
  setLang: (lang: AppLang) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      lang: 'en',
      
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      })),
      
      toggleLang: () => set((state) => ({
        lang: state.lang === 'en' ? 'ar' : 'en'
      })),
      
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'biteflow-settings-storage',
      partialize: (state) => ({
        theme: state.theme,
        lang: state.lang,
      }),
    }
  )
);

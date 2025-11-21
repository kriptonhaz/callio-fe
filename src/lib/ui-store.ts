import { Store } from "@tanstack/react-store"

export type ThemeMode = "light" | "dark"
export type Language = "en" | "id"

export interface UIState {
  themeMode: ThemeMode
  sidebarCollapsed: boolean
  language: Language
}

// SSR-safe localStorage access
const isBrowser = typeof window !== "undefined"

function getInitialTheme(): ThemeMode {
  if (!isBrowser) return "light"
  const stored = localStorage.getItem("callio-theme")
  if (stored === "light" || stored === "dark") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function getInitialLanguage(): Language {
  if (!isBrowser) return "en"
  const stored = localStorage.getItem("callio-language")
  return stored === "id" ? "id" : "en"
}

function getInitialSidebarState(): boolean {
  if (!isBrowser) return false
  const stored = localStorage.getItem("callio-sidebar-collapsed")
  return stored === "true"
}

const initialState: UIState = {
  themeMode: getInitialTheme(),
  sidebarCollapsed: getInitialSidebarState(),
  language: getInitialLanguage(),
}

export const uiStore = new Store<UIState>(initialState)

// Actions
export const toggleTheme = () => {
  uiStore.setState((state) => {
    const newMode = state.themeMode === "light" ? "dark" : "light"
    if (isBrowser) {
      localStorage.setItem("callio-theme", newMode)
      document.documentElement.classList.toggle("dark", newMode === "dark")
    }
    return { ...state, themeMode: newMode }
  })
}

export const setTheme = (mode: ThemeMode) => {
  if (isBrowser) {
    localStorage.setItem("callio-theme", mode)
    document.documentElement.classList.toggle("dark", mode === "dark")
  }
  uiStore.setState((state) => ({ ...state, themeMode: mode }))
}

export const toggleSidebar = () => {
  uiStore.setState((state) => {
    const newCollapsed = !state.sidebarCollapsed
    if (isBrowser) {
      localStorage.setItem("callio-sidebar-collapsed", String(newCollapsed))
    }
    return { ...state, sidebarCollapsed: newCollapsed }
  })
}

export const setLanguage = (language: Language) => {
  uiStore.setState((state) => {
    if (isBrowser) {
      localStorage.setItem("callio-language", language)
    }
    return { ...state, language }
  })
}

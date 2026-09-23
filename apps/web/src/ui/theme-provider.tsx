import {  createContext, useContext, useEffect, useState } from "react"
import type {ReactNode} from "react";

export type Theme = "dark" | "light" | "system"

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "dark" | "light"
  highContrast: boolean
  setHighContrast: (enabled: boolean) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = "so4-theme"
const HIGH_CONTRAST_KEY = "so4-high-contrast"

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function resolve(theme: Theme): "dark" | "light" {
  return theme === "system" ? getSystemTheme() : theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system"
    return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system"
  })

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(HIGH_CONTRAST_KEY) === "true"
  })

  const setTheme = (next: Theme) => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next)
    setThemeState(next)
  }

  const setHighContrast = (enabled: boolean) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(HIGH_CONTRAST_KEY, String(enabled))
    }
    setHighContrastState(enabled)
  }

  // Apply theme class (dark/light)
  useEffect(() => {
    const resolved = resolve(theme)
    const root = document.documentElement
    if (root.classList.contains(resolved)) return
    root.classList.remove("dark", "light")
    root.classList.add(resolved)
  }, [theme])

  // Apply high-contrast class
  useEffect(() => {
    const root = document.documentElement
    if (highContrast) {
      root.classList.add("high-contrast")
    } else {
      root.classList.remove("high-contrast")
    }
  }, [highContrast])

  useEffect(() => {
    if (theme !== "system") return
    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      const resolved = mql.matches ? "dark" : "light"
      document.documentElement.classList.remove("dark", "light")
      document.documentElement.classList.add(resolved)
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme: resolve(theme), highContrast, setHighContrast }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}

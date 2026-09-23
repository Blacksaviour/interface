import { createContext, useContext, useState } from "react"
import type { ReactNode } from "react"

export type Direction = "ltr" | "rtl"

interface DirectionContextValue {
  direction: Direction
  setDirection: (direction: Direction) => void
}

const DirectionContext = createContext<DirectionContextValue | undefined>(undefined)

const STORAGE_KEY = "so4-direction"

export function DirectionProvider({ children }: { children: ReactNode }) {
  const [direction, setDirectionState] = useState<Direction>(() => {
    if (typeof window === "undefined") return "ltr"
    return (localStorage.getItem(STORAGE_KEY) as Direction | null) ?? "ltr"
  })

  const setDirection = (next: Direction) => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next)
    setDirectionState(next)
    document.documentElement.dir = next
  }

  return (
    <DirectionContext.Provider value={{ direction, setDirection }}>
      {children}
    </DirectionContext.Provider>
  )
}

export function useDirection() {
  const ctx = useContext(DirectionContext)
  if (!ctx) throw new Error("useDirection must be used within DirectionProvider")
  return ctx
}
"use client"

import * as React from "react"

export type Density = "compact" | "default" | "comfortable"

interface DensityContextType {
  density: Density
  setDensity: (density: Density) => void
}

const DensityContext = React.createContext<DensityContextType | null>(null)

export function DensityProvider({
  children,
  defaultDensity = "default",
}: {
  children: React.ReactNode
  defaultDensity?: Density
}) {
  const [density, setDensityState] = React.useState<Density>(defaultDensity)

  React.useEffect(() => {
    const saved = localStorage.getItem("interface-density")
    if (saved && ["compact", "default", "comfortable"].includes(saved)) {
      setDensityState(saved as Density)
    }
  }, [])

  const setDensity = React.useCallback((newDensity: Density) => {
    setDensityState(newDensity)
    localStorage.setItem("interface-density", newDensity)
  }, [])

  React.useEffect(() => {
    const root = document.documentElement
    root.classList.remove("density-compact", "density-default", "density-comfortable")
    root.classList.add(`density-${density}`)
  }, [density])

  return (
    <DensityContext.Provider value={{ density, setDensity }}>
      {children}
    </DensityContext.Provider>
  )
}

export function useDensity() {
  const context = React.useContext(DensityContext)
  if (!context) {
    throw new Error("useDensity must be used within a DensityProvider")
  }
  return context
}

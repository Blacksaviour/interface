import type { ReactNode } from "react"

export function IconBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex size-10 items-center justify-center rounded-8 bg-gmx-slate-650 text-white">
      {children}
    </div>
  )
}

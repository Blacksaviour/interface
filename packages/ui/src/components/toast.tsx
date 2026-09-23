"use client"

import * as React from "react"
import { Alert01Icon, Cancel01Icon, InformationCircleIcon, ReloadIcon, Tick02Icon } from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
import { Icon } from "./icon"

export type ToastVariant = "info" | "success" | "warning" | "error" | "transaction-progress"

export type ToastAction = {
  label: string
  onClick: () => void
}

export type ToastItem = {
  id: string
  message: string
  description?: React.ReactNode
  variant: ToastVariant
  duration: number
  action?: ToastAction
  persistent?: boolean
}

let _counter = 0
function nextId() {
  return `toast-${++_counter}`
}

type ToastListener = (toasts: Array<ToastItem>) => void
const listeners = new Set<ToastListener>()
let toasts: Array<ToastItem> = []

function emit() {
  listeners.forEach(l => l([...toasts]))
}

export const toast = {
  show: (item: Omit<ToastItem, "id" | "duration"> & { id?: string, duration?: number }) => {
    const id = item.id || nextId()
    const duration = item.duration ?? 4000
    const newItem = { ...item, id, duration }
    const existingIdx = toasts.findIndex(t => t.id === id)
    if (existingIdx >= 0) {
      toasts[existingIdx] = newItem
    } else {
      toasts = [...toasts, newItem]
    }
    emit()
    return id
  },
  success: (message: string, opts?: Omit<Partial<ToastItem>, "message" | "variant">) => {
    return toast.show({ message, variant: "success", ...opts })
  },
  error: (message: string, opts?: Omit<Partial<ToastItem>, "message" | "variant">) => {
    return toast.show({ message, variant: "error", ...opts })
  },
  info: (message: string, opts?: Omit<Partial<ToastItem>, "message" | "variant">) => {
    return toast.show({ message, variant: "info", ...opts })
  },
  warning: (message: string, opts?: Omit<Partial<ToastItem>, "message" | "variant">) => {
    return toast.show({ message, variant: "warning", ...opts })
  },
  loading: (message: string, opts?: Omit<Partial<ToastItem>, "message" | "variant">) => {
    return toast.show({ message, variant: "transaction-progress", duration: 0, persistent: true, ...opts })
  },
  dismiss: (id: string) => {
    toasts = toasts.filter(t => t.id !== id)
    emit()
  },
}

export function useToast() {
  const [currentToasts, setCurrentToasts] = React.useState<Array<ToastItem>>(toasts)

  React.useEffect(() => {
    const listener = (newToasts: Array<ToastItem>) => setCurrentToasts(newToasts)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return { toasts: currentToasts, toast, dismiss: toast.dismiss }
}

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: "bg-green-900/90 text-green-100 border-green-700/50",
  error: "bg-red-900/90 text-red-100 border-red-700/50",
  warning: "bg-yellow-900/90 text-yellow-100 border-yellow-700/50",
  info: "bg-slate-800/90 text-slate-100 border-slate-700/50",
  "transaction-progress": "bg-blue-900/90 text-blue-100 border-blue-700/50",
}

const VARIANT_ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <Icon icon={Tick02Icon} size="md" tone="success" className="text-green-400" />,
  error: <Icon icon={Cancel01Icon} size="md" tone="error" className="text-red-400" />,
  warning: <Icon icon={Alert01Icon} size="md" tone="warning" className="text-yellow-400" />,
  info: <Icon icon={InformationCircleIcon} size="md" tone="info" className="text-blue-400" />,
  "transaction-progress": <Icon icon={ReloadIcon} size="md" tone="info" className="text-blue-400 animate-spin" />,
}

const VARIANT_LABEL: Record<ToastVariant, string> = {
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info",
  "transaction-progress": "Transaction in progress",
}

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isHovered, setIsHovered] = React.useState(false)

  React.useEffect(() => {
    if (item.persistent || item.duration <= 0 || isHovered) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }
    timerRef.current = setTimeout(() => onDismiss(item.id), item.duration)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [item.id, item.duration, item.persistent, isHovered, onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${VARIANT_LABEL[item.variant]}: ${item.message}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-4 text-sm shadow-lg pointer-events-auto transition-all w-80",
        VARIANT_CLASSES[item.variant],
      )}
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="shrink-0 mt-0.5">{VARIANT_ICONS[item.variant]}</div>
          <div className="flex flex-col gap-1">
            <span className="font-medium leading-none">{item.message}</span>
            {item.description && (
              <div className="text-xs opacity-90 mt-1">{item.description}</div>
            )}
          </div>
        </div>
        <button
          aria-label="Dismiss"
          onClick={() => onDismiss(item.id)}
          className="shrink-0 opacity-70 hover:opacity-100 focus:opacity-100 outline-none"
        >
          <Icon icon={Cancel01Icon} size="sm" />
        </button>
      </div>
      {item.action && (
        <div className="mt-2 pl-8">
          <button
            onClick={() => {
              item.action?.onClick()
              onDismiss(item.id)
            }}
            className="text-xs font-medium underline underline-offset-2 opacity-80 hover:opacity-100 focus:opacity-100 outline-none"
          >
            {item.action.label}
          </button>
        </div>
      )}
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts: activeToasts, dismiss } = useToast()

  return (
    <>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {activeToasts.map((t) => (
          <Toast key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </div>
    </>
  )
}

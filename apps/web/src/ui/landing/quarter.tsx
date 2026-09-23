export type QuarterItem = { text: string; completed: boolean }

export type QuarterData = {
  label: string
  items: Array<QuarterItem>
  lastCompleted?: boolean
}

export function Quarter({ label, items, lastCompleted }: QuarterData) {
  return (
    <div className="w-64 shrink-0 sm:w-70.5">
      <div className="relative h-0.5 w-full bg-gmx-slate-600">
        {lastCompleted && (
          <>
            <div className="absolute inset-y-0 left-0 w-full bg-linear-to-r from-gmx-slate-600 to-gmx-blue-400" />
            <span className="absolute -top-1 right-0 size-2.5 rounded-full bg-gmx-blue-400 ring-4 ring-gmx-blue-400/25" />
          </>
        )}
      </div>
      <p className="mt-4 text-14 font-medium text-gmx-slate-400">{label}</p>
      <ul className="mt-4 flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.text} className={item.completed ? "text-16 text-white" : "text-16 text-gmx-slate-600"}>
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  )
}

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

// No newsletter endpoint exists yet — silently doing nothing on submit
// (the previous behavior) looks broken to a real visitor who typed their
// email and clicked Subscribe. Disabling the control with a visible reason
// is honest about the current state instead of pretending to work.
// TODO(GF3-003): wire to SO4's real newsletter endpoint once one exists,
// then remove the disabled state and title attribute below.
export function NewsletterForm() {
  return (
    <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
      <Input
        type="email"
        name="email"
        required
        disabled
        placeholder="Enter your email"
        className="h-auto rounded-8 border-hairline border-gmx-slate-600 bg-gmx-slate-800 px-4 py-2.5 text-14 text-white placeholder:text-gmx-slate-500 hover:bg-gmx-slate-650 focus-visible:bg-gmx-slate-650"
      />
      <Button
        type="submit"
        variant="default"
        disabled
        title="Newsletter signup is coming soon"
        className="btn-landing shrink-0 rounded-8 px-4 py-2.5 text-14"
      >
        Subscribe
      </Button>
    </form>
  )
}

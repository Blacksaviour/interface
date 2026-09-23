/**
 * DX-016: unobtrusive dot shown on a navbar item when a major/minor release
 * has shipped since this browser last acknowledged the changelog.
 *
 * The dot itself is decorative (aria-hidden); the accessible name of the host
 * nav item carries the state instead — compose it with an `aria-label` such
 * as "Changelog — new releases".
 */
export function WhatsNewDot({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span
      aria-hidden="true"
      data-slot="whats-new-dot"
      className="ml-1.5 inline-block size-1.5 shrink-0 rounded-full bg-danger align-super"
    />
  )
}

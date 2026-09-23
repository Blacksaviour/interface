import { Link } from "@tanstack/react-router"

function EyebrowPill({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-8 bg-linear-to-r from-gmx-blue-400/20 to-gmx-blue-300/20 px-2.5 py-1 text-12 font-medium text-gmx-blue-300">
      {children}
    </span>
  )
}

export function ProgramCards() {
  return (
    <section className="relative w-full overflow-hidden bg-gmx-slate-900 pt-15 text-white sm:pt-30">
      {/* GMX's home_program_glow.png isn't public — recreated as a CSS
          radial gradient matching docs/gf_3/screenshots/programs-desktop.png
          (a soft glow centered behind the headline, fading before the
          cards). */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-160 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,var(--color-gmx-blue-400)/0.14,transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-300 px-4 sm:px-10">
        <h2 className="text-heading-1">
          Built for those
          <br />
          who do more.
        </h2>

        {/* Card 2 (GMX's "Build on GMX" developer/builder-fee program) is
            dropped: SO4 has no builder-fee or SDK program in the codebase —
            keeping GMX's shape here would advertise something that doesn't
            exist. One real card instead of one real and one invented. */}
        <div className="mt-9 grid grid-cols-1 gap-6 pb-20 sm:pb-30">
          <div className="relative max-w-130 overflow-hidden rounded-20 border border-hairline border-gmx-slate-600/50 bg-gmx-slate-800 p-9 shadow-[0_6px_8px_-6px_var(--color-gmx-card-shadow)]">
            <div className="flex gap-2">
              <EyebrowPill>For traders</EyebrowPill>
              <EyebrowPill>For affiliates</EyebrowPill>
            </div>
            <h3 className="mt-6 text-heading-4">Trade size. Or refer those who do.</h3>
            {/* Real numbers from apps/web/src/features/referrals/data/tiers.ts:
                a flat 5% fee discount at every tier, and affiliate commission
                that scales 5% → 15% with referred volume (Bronze/Silver/Gold). */}
            <p className="mt-3 max-w-[320px] text-description">
              5% off open and close fees on every trade. Affiliates earn 5% to 15% commission,
              scaling with referred volume.
            </p>
            <Link
              to="/referrals"
              className="btn-landing mt-6 inline-flex rounded-8 px-4 py-2.5 text-14"
            >
              Explore the referrals program
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

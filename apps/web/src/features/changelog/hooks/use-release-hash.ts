import { useEffect } from "react"
import { isReleaseHash } from "../lib/version-anchor"

function focusHashTarget() {
  if (!isReleaseHash(window.location.hash)) return

  const target = document.getElementById(window.location.hash.slice(1))
  if (!target) return

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches

  target.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "start",
  })
  target.focus({ preventScroll: true })
}

export function useReleaseHash(releasesReady: boolean) {
  useEffect(() => {
    if (!releasesReady) return

    focusHashTarget()
    window.addEventListener("hashchange", focusHashTarget)
    return () => window.removeEventListener("hashchange", focusHashTarget)
  }, [releasesReady])
}

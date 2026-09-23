import "@vitest/expect"

/**
 * vitest-axe@0.1.0 augments the legacy global `Vi` namespace, which Vitest 3 no
 * longer reads. Re-declare the matcher against `@vitest/expect` — the module
 * that actually declares `Assertion` (the `vitest` package just re-exports
 * it, so augmenting `vitest` directly doesn't merge) — so
 * `expect(results).toHaveNoViolations()` type-checks. The matcher itself is
 * registered in ./vitest.setup.ts.
 */
declare module "@vitest/expect" {
  interface Assertion<T = any> {
    toHaveNoViolations: () => void
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations: () => void
  }
}

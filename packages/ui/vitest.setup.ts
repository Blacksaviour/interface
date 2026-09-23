import "@testing-library/jest-dom/vitest"
// vitest-axe@0.1.0 ships an empty `extend-expect` entry, so the matcher has to
// be registered by hand (its typings live in ./axe-matchers.d.ts).
import * as axeMatchers from "vitest-axe/matchers"
import { afterEach, expect } from "vitest"
import { cleanup } from "@testing-library/react"

expect.extend(axeMatchers)

// jsdom implements the layout-free subset of the DOM, so scrollIntoView is
// absent at runtime even though the DOM lib types declare it as always present
// — hence the widened type here rather than a direct property check.
const elementProto = Element.prototype as { scrollIntoView?: () => void }
if (!elementProto.scrollIntoView) {
  elementProto.scrollIntoView = () => {}
}

afterEach(() => {
  cleanup()
})

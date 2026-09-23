import "@testing-library/jest-dom/vitest"
import * as axeMatchers from "vitest-axe/matchers"
import { expect } from "vitest"

expect.extend(axeMatchers)

HTMLCanvasElement.prototype.getContext = (() =>
  null) as HTMLCanvasElement["getContext"]

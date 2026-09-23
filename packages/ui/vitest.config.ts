import { defineConfig, mergeConfig } from "vitest/config"
import { reactConfig } from "@repo/vitest-config/react"

export default mergeConfig(
  reactConfig,
  defineConfig({
    test: {
      // setupFiles comes from reactConfig (./vitest.setup.ts) — mergeConfig
      // concatenates arrays, so overriding it here would add a second entry.
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      server: {
        deps: {
          inline: [
            "react",
            "react-dom",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            "@testing-library/react",
            "@testing-library/user-event",
            "@testing-library/jest-dom",
            "vitest-axe",
          ],
        },
      },
    },
  })
)

import { defineConfig, mergeConfig } from "vitest/config"
import viteTsConfigPaths from "vite-tsconfig-paths"
import { reactConfig } from "@repo/vitest-config/react"

export default mergeConfig(
  reactConfig,
  defineConfig({
    plugins: [
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
    ],
    test: {
      include: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "test/**/*.{test,spec}.{ts,tsx}",
      ],
      coverage: {
        exclude: [
          "**/.output/**",
          "src/routeTree.gen.ts",
          "src/routes/**",
          "src/lib/content-checker.cli.ts",
          "**/*.config.*",
        ],
      },
    },
  })
)

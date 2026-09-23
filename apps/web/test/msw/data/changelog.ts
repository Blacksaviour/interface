import type { ChangelogData } from "@/features/changelog/types"

/**
 * Shared fixtures backing the default MSW handlers for the generated
 * changelog files (DX-012). Tests that need specific shapes override these
 * with server.use().
 */

export const mockRecentChangelog: ChangelogData & { hasArchive: true } = {
  hasArchive: true,
  releases: [
    {
      version: "0.4.0",
      date: "2026-08-24",
      yanked: false,
      entries: [
        {
          type: "added",
          area: "trade",
          text: "Trigger orders on the trade panel, including take-profit and stop-loss with independent trigger prices.",
          pr: 512,
          breaking: false,
        },
      ],
    },
    {
      version: "0.3.2",
      date: "2026-08-11",
      yanked: false,
      entries: [
        {
          type: "fixed",
          area: "pools",
          text: "Pool APY calculation now correctly handles zero-volume periods.",
          pr: 508,
          breaking: false,
        },
      ],
    },
  ],
}

export const mockArchiveChangelog: ChangelogData = {
  releases: [
    {
      version: "0.1.0",
      date: "2026-07-15",
      yanked: false,
      entries: [
        {
          type: "added",
          area: "general",
          text: "First public release of the SO4 Market interface.",
          pr: null,
          breaking: false,
        },
        {
          type: "added",
          area: "internal",
          text: "Internal performance metrics dashboard.",
          pr: 505,
          breaking: false,
        },
      ],
    },
  ],
}

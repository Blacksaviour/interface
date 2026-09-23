import { useQuery } from "@tanstack/react-query"
import { changelogQueryKey, getChangelog } from "../lib/changelog-client"

export function useChangelog() {
  return useQuery({
    queryKey: changelogQueryKey,
    queryFn: getChangelog,
    staleTime: Number.POSITIVE_INFINITY,
  })
}

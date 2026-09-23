import { createFileRoute } from "@tanstack/react-router"
import { DocsHome } from "../components/DocsHome"

export const Route = createFileRoute("/")({
  component: DocsHome,
})

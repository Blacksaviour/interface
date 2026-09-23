import { mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

export interface OgImageOptions {
  title: string
  section?: string
  description?: string
  siteName?: string
}

export function generateOgSvg({
  title,
  section = "Documentation",
  description = "",
  siteName = "SO4 Market",
}: OgImageOptions): string {
  const safeTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const safeSection = section.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const safeDesc = description.slice(0, 140).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0d12" />
      <stop offset="50%" stop-color="#17191d" />
      <stop offset="100%" stop-color="#0e131f" />
    </linearGradient>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3156c8" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
  </defs>

  <!-- Canvas background -->
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect x="40" y="40" width="1120" height="550" rx="16" fill="none" stroke="#262930" stroke-width="2" />

  <!-- Accent top bar -->
  <rect x="40" y="40" width="1120" height="8" rx="4" fill="url(#brandGrad)" />

  <!-- Section Badge -->
  <g transform="translate(80, 100)">
    <rect width="180" height="36" rx="18" fill="#1e2436" stroke="#3156c8" stroke-width="1.5" />
    <text x="90" y="23" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#9ab4ff" text-anchor="middle">
      ${safeSection.toUpperCase()}
    </text>
  </g>

  <!-- Title -->
  <text x="80" y="230" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="700" fill="#ffffff" width="1040">
    ${safeTitle}
  </text>

  <!-- Description -->
  ${
    safeDesc
      ? `<text x="80" y="320" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="400" fill="#9da4b0" width="1040">
    ${safeDesc}
  </text>`
      : ""
  }

  <!-- Footer / SO4 Branding Mark -->
  <g transform="translate(80, 480)">
    <rect width="56" height="56" rx="14" fill="url(#brandGrad)" />
    <text x="28" y="36" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#ffffff" text-anchor="middle">
      SO4
    </text>
    <text x="76" y="35" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="#ffffff">
      ${siteName}
    </text>
  </g>
</svg>`
}

export async function saveOgImage(outputPath: string, options: OgImageOptions): Promise<void> {
  const svg = generateOgSvg(options)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, svg, "utf-8")
}

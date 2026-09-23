import { describe, expect, test } from "bun:test"
import {
  parseImageDimensionsBuffer,
  getDarkVariantPath,
  validateImageRef,
  renderOptimizedImageTag,
} from "../src/lib/image-pipeline"

describe("Docs image asset pipeline (DX-055)", () => {
  test("extracts intrinsic dimensions from PNG buffer header", () => {
    // Construct a valid PNG header with width 1920 (0x0780) and height 1080 (0x0438)
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Signature
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk length & type
      0x00, 0x00, 0x07, 0x80, // width: 1920
      0x00, 0x00, 0x04, 0x38, // height: 1080
      0x08, 0x06, 0x00, 0x00, 0x00,
    ])

    const dimensions = parseImageDimensionsBuffer(pngHeader)
    expect(dimensions).not.toBeNull()
    expect(dimensions?.width).toBe(1920)
    expect(dimensions?.height).toBe(1080)
  })

  test("generates dark variant filename convention name.dark.ext", () => {
    expect(getDarkVariantPath("/assets/architecture.png")).toBe("/assets/architecture.dark.png")
    expect(getDarkVariantPath("/images/flow.jpg")).toBe("/images/flow.dark.jpg")
  })

  test("validates alt text requirement and decorative opt-out", () => {
    expect(validateImageRef("/img.png", "Architecture diagram").valid).toBe(true)
    expect(validateImageRef("/img.png", "").valid).toBe(false)
    expect(validateImageRef("/img.png", 'alt=""').valid).toBe(true)
  })

  test("renders optimized img and picture tags with width/height and eager/lazy loading", () => {
    const eagerTag = renderOptimizedImageTag({
      src: "/assets/hero.png",
      alt: "Hero Banner",
      width: 1200,
      height: 600,
      hasDarkVariant: false,
      index: 0,
    })

    expect(eagerTag).toContain('src="/assets/hero.png"')
    expect(eagerTag).toContain('alt="Hero Banner"')
    expect(eagerTag).toContain('width="1200"')
    expect(eagerTag).toContain('height="600"')
    expect(eagerTag).toContain('loading="eager"')
    expect(eagerTag).toContain('fetchpriority="high"')

    const lazyDarkTag = renderOptimizedImageTag({
      src: "/assets/diagram.png",
      alt: "Diagram",
      width: 800,
      height: 400,
      hasDarkVariant: true,
      index: 1,
    })

    expect(lazyDarkTag).toContain('<picture className="docs-image-wrapper">')
    expect(lazyDarkTag).toContain('srcset="/assets/diagram.dark.png"')
    expect(lazyDarkTag).toContain('loading="lazy"')
  })
})

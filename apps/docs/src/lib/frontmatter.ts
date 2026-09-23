import { z } from "zod"

export const frontmatterSchema = z.object({
  title: z
    .string()
    .min(1, "title is required")
    .max(60, "title must be ≤ 60 characters"),
  description: z
    .string()
    .min(50, "description must be 50–160 characters")
    .max(160, "description must be 50–160 characters"),
  updated: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "updated must be an ISO date (YYYY-MM-DD)",
  ),
  status: z.enum(["stable", "beta", "draft"]),
  sidebarLabel: z.string().optional(),
  order: z.number().optional(),
  tags: z.array(z.string()).optional(),
})

export type Frontmatter = z.infer<typeof frontmatterSchema>

export function validateFrontmatter(
  file: string,
  data: Record<string, unknown>,
): Frontmatter {
  const result = frontmatterSchema.safeParse(data)
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path.join(".") || "(root)"
      throw new Error(`${file}: frontmatter.${field} — ${issue.message}`)
    }
    throw new Error(`${file}: frontmatter validation failed`)
  }
  return result.data
}

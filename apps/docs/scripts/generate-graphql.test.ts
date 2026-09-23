import { describe, expect, test } from "bun:test"

import { parseSchema, renderGraphQLReference } from "./generate-graphql"

describe("GraphQL reference generator", () => {
  test("renders every type and field", () => {
    const output = renderGraphQLReference([
      {
        name: "Position",
        description: "Current position state.",
        fields: [
          { name: "id", type: "ID!", arguments: "" },
          { name: "account", type: "String!", arguments: "" },
        ],
      },
    ])
    expect(output).toContain("### Position")
    expect(output).toContain("| `account` | `String!` | - |")
    expect(output).toContain("| `position` | `Position` | `id: ID!` |")
  })

  test("covers the checked-in indexer schema", async () => {
    const schema = await Bun.file("../s03-indexer/schema.graphql").text()
    const types = parseSchema(schema)
    expect(types).toHaveLength(19)
    expect(types.reduce((count, type) => count + type.fields.length, 0)).toBe(311)
  })
})
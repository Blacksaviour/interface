# CLAUDE.md

The operating contract for AI agents in this repository lives in
**[`AGENTS.md`](./AGENTS.md)** — read it before making any change.

It is binding, and covers in particular:

- **The commit gate** — `bun lint`, `bun typecheck`, `bun run check:tokens`,
  `bun run test`, `bun run test:coverage`, `bun run build` must all be run and
  pass before any commit or pull request.
- **No green-washing** — never use `eslint-disable`, `@ts-ignore`, `.skip`,
  lowered coverage thresholds, or similar to make a check pass.
- **Complete fixes** — root cause, sibling instances, regression test.
- **Clean-room verification** — when dependencies or build config change.
- **Repository invariants** — dependency declaration, generated code, design
  tokens, MSW.

Human contributors: see [`CONTRIBUTING.md`](./CONTRIBUTING.md).

# SO4 Documentation Prose Style Guide

This document outlines the voice, tone, and automated linting rules enforced across all SO4 documentation and repository markdown files.

---

## 1. Core Principles

- **Plain, specific, unhurried.** Short sentences carry technical weight better than long ones.
- **Concrete over abstract.** "The order vault holds collateral until the position closes" beats "Collateral is managed by the vault subsystem".
- **No condescension.** Words like "simply", "just", "obviously", "easy", and "easily" imply obviousness and are prohibited.
- **No exclamation marks.** Technical documentation informs; it does not shout.

---

## 2. Automated Lint Rules

The prose linter (`bun run --cwd apps/docs lint:prose`) enforces the following rules:

### Correctness Rules (Errors — Fail Build)

| Rule ID | Constraint |
| ------- | ---------- |
| `no-exclamation-mark` | Prohibits exclamation marks (`!`) in documentation prose. |
| `banned-words` | Prohibits "simply", "just", "obviously", "easy", "easily". |
| `correct-capitalization` | Enforces exact capitalization for project terms: "Soroban", "Stellar", "Freighter", "Turborepo", "OrderVault", "ExchangeRouter", "SyntheticsReader", "DataStore". |

### Style Rules (Warnings — Reported in Output)

| Rule ID | Constraint |
| ------- | ---------- |
| `sentence-length` | Flags sentences exceeding 30 words. |
| `prefer-active-voice` | Suggests active voice over passive constructions (e.g. "is managed by"). |

---

## 3. Authoring Checklist

Before submitting a PR:

```bash
bun run --cwd apps/docs lint
```

Ensure all prose linter errors are fixed.

# Changelog Entries

This directory holds unreleased changelog entries, one file per pull request.

## Workflow

Each PR that introduces a **user-visible change** should create one file here before merging:

1. **Create a file** named `{pr-number}-{short-description}.md`
   - Example: `512-trigger-orders.md`
   - Only alphanumerics, hyphens, and numbers are allowed in filenames

2. **Add frontmatter** with metadata:
   ```yaml
   ---
   type: added      # one of: added | changed | deprecated | removed | fixed | security
   area: trade      # one of: trade | pools | earn | referrals | faucet | wallet | docs | ci | internal
   pr: 512          # pull request number (required for linking)
   breaking: false  # whether this is a breaking change
   ---
   ```

3. **Write the body** — one or two sentences describing the change from a user's perspective:
   ```markdown
   Trigger orders are now available on the trade panel, including
   take-profit and stop-loss with independent trigger prices.
   ```

## Validation

Run `bun run changelog:validate` to check all entries before committing:

- ✅ Frontmatter parses as valid YAML
- ✅ `type` and `area` are valid enum values
- ✅ `pr` is a positive integer
- ✅ `breaking` is a boolean
- ✅ Body is non-empty and under 500 characters
- ✅ Body is a proper sentence ending in a period
- ✅ Body does not start with a conventional commit prefix

## Release

When cutting a release, run `bun run changelog:release 0.4.0` to:

1. Validate all pending entries
2. Group entries by category
3. Move them into `CHANGELOG.md` under a new version heading
4. Delete the consumed entry files
5. Write today's date

See `docs/dx_1/002_changelog.md` for the full specification.

## Categories

- **Added:** New features and capabilities
- **Changed:** Changes to existing functionality
- **Deprecated:** Features marked for removal in a future version
- **Removed:** Removed features (with the reason why)
- **Fixed:** Bug fixes
- **Security:** Security vulnerabilities and fixes

## Areas

- **trade:** Trading interface, order types, positions
- **pools:** Liquidity pools, yield farming
- **earn:** Staking and earning opportunities
- **referrals:** Referral program, commissions, codes
- **faucet:** Testnet faucet
- **wallet:** Wallet integration, authentication
- **docs:** Documentation and guides
- **ci:** CI/CD and build infrastructure
- **internal:** Internal refactors, no user impact

See [`TEMPLATE.md`](./TEMPLATE.md) for a quickstart.

# DX1 — Documentation Content Map

The information architecture for `docs.so4.market`, and the brief for every
content issue in [`dx_issues.md`](./dx_issues.md). Companion to
[`001_docs_site.md`](./001_docs_site.md) (how the site is built).

**Questions?** Reach out to the maintainer at [t.me/ibrahimijai](https://t.me/ibrahimijai).

> **Implementation status (2026-08-24):** `/concepts/risk`,
> `/concepts/funding-and-fees`, `/concepts/liquidation`, `/reference/glossary`,
> `/resources/terms`, `/resources/faq`, `/resources/roadmap`, and
> `/resources/changelog` are implemented and reachable from the sidebar. All other
> pages in §2 are explicitly deferred because their prerequisite DX1 content or
> generated-reference issues have not landed. The three intended reader journeys
> therefore cannot yet be walked end to end: trader onboarding stops before
> quickstart/trading, liquidity-provider onboarding stops before pools, and the
> integrator journey stops before local setup and contract clients. This is the
> audited built state, not a claim that deferred paths exist.

---

## 1. Who we are writing for

Three readers, in priority order. Every page should be obviously aimed at one of
them, and pages that try to serve all three serve none.

| Reader                       | Arrives asking                                           | Success looks like                                                                           |
| ---------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Trader**                   | "What happens to my collateral if this goes against me?" | Leaves with a correct mental model of margin, funding, and liquidation — before they need it |
| **Liquidity provider**       | "What am I actually exposed to by depositing?"           | Understands the pool's risk, fee accrual, and exit conditions                                |
| **Integrator / contributor** | "How do I call this contract, or run this locally?"      | Copies a snippet that works on the first try                                                 |

Marketing lives on the landing page. Docs explain mechanics, including the
unflattering parts — a risk page that only lists upside is worse than no risk
page, because it teaches readers not to trust the rest.

## 2. Section tree

```
/                          Docs home — three doors, one per reader
/get-started/
    introduction           What SO4 is, in ~400 words
    quickstart             Wallet → testnet funds → first trade
    wallets                Freighter, Wallets Kit, passkeys/smart accounts
    testnet                Networks, faucet, what is and isn't real
/concepts/
    perpetuals             What a perp is, funding as the tether to spot
    unified-liquidity      SO4's pool model and why it differs from isolated books
    margin-and-leverage    Collateral, position size, effective leverage
    liquidation            Maintenance margin, liquidation price, partial liquidation
    funding-and-fees       Funding rate, borrow fee, open/close fees, price impact
    order-types            Market, limit, trigger (TP/SL) and their execution guarantees
    oracles                Binance primary, GMX fallback, Pyth — staleness and deviation
    risk                   Honest enumeration of what can go wrong
/guides/
    trading                The trade page, panel by panel
    positions              Reading positions, orders, trades, claims
    pools                  Adding and removing liquidity
    earn                   Portfolio, rewards, distributions
    referrals              Codes, tiers, commissions
    faucet                 Getting testnet assets
    troubleshooting        Failed transactions, stuck states, RPC errors
/developers/
    architecture           Monorepo map: apps, packages, data flow
    local-setup            Clone → bun install → dev, and the commit gate
    contract-clients       Calling Soroban contracts from TypeScript
    reading-data           Positions, orders, and market data from RPC/indexer
    writing-transactions   Building, simulating, signing, submitting, error handling
    indexer                Running the indexer, GraphQL schema, local sync
    design-system          Tokens, primitives, and the check:tokens contract
    contributing           Pointer to CONTRIBUTING.md, not a copy of it
/reference/
    contracts              Deployed IDs per network (generated)
    graphql                Indexer schema (generated)
    tokens                 Design tokens (generated)
    errors                 Contract and client error codes
    glossary               Terms, alphabetical
/resources/
    security               Audits, disclosure policy, bug bounty
    terms                  Risk disclosure and terms of use
    faq                    Single source; the landing page FAQ renders from it
    roadmap                What is planned, honestly dated
    changelog              Link out to so4.market/changelog
```

## 3. Page contract

Every content page ships with:

1. **A one-sentence answer up top.** The first paragraph must answer the page's
   title question without scrolling. Background comes after.
2. **A worked example with real numbers.** "Leverage amplifies losses" is a
   truism. "A 10x long on 100 USDC liquidates at a 9.1% adverse move, leaving
   you with roughly 0 USDC" is a fact a reader can check.
3. **Explicit links to adjacent concepts**, not a "see also" dump.
4. **A `updated:` date that is true**, validated against git history.

And avoids:

- Screenshots of things that change weekly. Prefer a described flow, or a
  screenshot with a visual-regression baseline behind it.
- Numbers that will silently rot. Fees, addresses, and schema come from
  generated pages (see `001_docs_site.md` §6) or are stated as "current as of".
- Second person imperative stacked ten deep. Use `<Steps>` when it is genuinely
  a procedure and prose when it is not.

## 4. Content-issue definition of done

A content issue is complete when:

- [ ] The page exists at its mapped path with valid frontmatter.
- [ ] `bun run --cwd apps/docs check:content` and `check:links` pass.
- [ ] Every claim about mechanics is traceable to contract code, the indexer, or
      `apps/web` behaviour — with the file path named in the PR description.
- [ ] The worked example's numbers were computed, not estimated.
- [ ] The page is listed in its section's `meta.json`.
- [ ] Prose lint passes and the reading level is appropriate for the target
      reader named in §1.

## 5. Voice

Plain, specific, unhurried. Short sentences carry technical weight better than
long ones. Prefer the concrete noun to the abstract one — "the order vault holds
your collateral until the position closes" beats "collateral is managed by the
vault subsystem".

No exclamation marks. No "simply", "just", or "obviously" — if it were obvious
the page would not exist. Hedge only when the uncertainty is real, and then say
what the uncertainty is.

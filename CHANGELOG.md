# Changelog

All notable changes to SO4 Market are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.4.0] - 2026-08-24

### Added

- Trigger orders on the trade panel, including take-profit and stop-loss with independent trigger prices. ([#512](https://github.com/SO4-Markets/interface/pull/512)) <!-- so4: area=trade -->

### Fixed

- Liquidation price line no longer drifts after a theme switch. ([#514](https://github.com/SO4-Markets/interface/pull/514)) <!-- so4: area=trade -->

## [0.3.2] - 2026-08-11

### Fixed

- Pool APY calculation now correctly handles zero-volume periods. ([#508](https://github.com/SO4-Markets/interface/pull/508)) <!-- so4: area=pools -->

## [0.3.1] - 2026-08-01

### Changed

- Improved gas estimation for complex multi-swap transactions. ([#501](https://github.com/SO4-Markets/interface/pull/501)) <!-- so4: area=wallet -->

### Added

- Detailed performance metrics dashboard for internal use. ([#505](https://github.com/SO4-Markets/interface/pull/505)) <!-- so4: area=internal -->

## [0.3.0] - 2026-07-28

### Added

- Referral codes now apply automatically at trade confirmation when linked. ([#489](https://github.com/SO4-Markets/interface/pull/489)) <!-- so4: area=referrals -->

### Changed

- Market list sorts by 24h volume instead of creation order. ([#492](https://github.com/SO4-Markets/interface/pull/492)) <!-- so4: area=trade -->

## [0.2.3] - 2026-07-30

### Fixed

- Wallet session no longer drops after an idle period shorter than the lock timeout. ([#485](https://github.com/SO4-Markets/interface/pull/485)) <!-- so4: area=wallet -->

## [0.2.2] - 2026-07-26

### Fixed

- Faucet claim button disabled state stuck after a failed transaction. ([#480](https://github.com/SO4-Markets/interface/pull/480)) <!-- so4: area=faucet -->

## [0.2.1] - 2026-07-24

### Security

- Dependency audit: bumped vite and esbuild to patched releases. ([#477](https://github.com/SO4-Markets/interface/pull/477)) <!-- so4: area=ci -->

## [0.2.0] - 2026-07-21

### Added

- Pool creation wizard with fee-tier selection and deposit preview. ([#468](https://github.com/SO4-Markets/interface/pull/468)) <!-- so4: area=pools -->
- Position close-out preview showing estimated PnL and fees before confirmation. ([#471](https://github.com/SO4-Markets/interface/pull/471)) <!-- so4: area=trade breaking -->

### Changed

- Order submission now batches margin checks to cut one round trip. ([#470](https://github.com/SO4-Markets/interface/pull/470)) <!-- so4: area=internal -->

## [0.1.2] - 2026-07-18

### Fixed

- Candlestick chart no longer double-renders on fast theme toggles. ([#459](https://github.com/SO4-Markets/interface/pull/459)) <!-- so4: area=trade -->

## [0.1.1] - 2026-07-16

### Fixed

- Docs search index regenerated after deploy so new pages are findable. ([#455](https://github.com/SO4-Markets/interface/pull/455)) <!-- so4: area=docs -->

## [0.1.0] - 2026-07-15

The first release captures the state of SO4 Market at the completion of the design system pass, the core trading infrastructure, and the developer documentation foundation.

### Added

- **Core Trading:** Long and short perpetual positions on Stellar/Soroban with market, limit, and trigger order types. <!-- so4: area=trade -->
- **Chart:** Real-time price feed integration (Binance primary, GMX fallback) with candlestick charting (lightweight-charts v5), position entry and liquidation lines. <!-- so4: area=trade -->
- **Positions Panel:** Real-time views of active positions, open orders, historical trades, and claimable rewards across tabs. <!-- so4: area=trade -->
- **Pools:** Pool discovery, portfolio overview, and reward distribution interfaces for liquidity provision. <!-- so4: area=pools -->
- **Earn & Referrals:** Portfolio management, additional earning opportunities, trader discount codes, and affiliate commission distributions. <!-- so4: area=earn -->
- **Landing Page:** Market ticker snapshot, order book preview, protocol statistics, and trade entry points. <!-- so4: area=general -->
- **Responsive Design:** Full-featured UI across desktop and tablet viewports. <!-- so4: area=general -->
- **Theme Support:** Dark and light mode with zero flash on load, memory of user preference. <!-- so4: area=general -->
- **Design System:** Complete design tokens, component library, and documentation (DS-001 through DS-085). <!-- so4: area=docs -->
- **Contract Clients:** Generated TypeScript clients for Soroban contract interaction (ExchangeRouter, DataStore, SyntheticsReader, OrderVault). <!-- so4: area=internal -->
- **Developer Documentation:** Setup guides, architecture reference, and integration contracts reference. <!-- so4: area=docs -->

[Unreleased]: https://github.com/SO4-Markets/interface/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/SO4-Markets/interface/releases/tag/v0.4.0
[0.3.2]: https://github.com/SO4-Markets/interface/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/SO4-Markets/interface/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/SO4-Markets/interface/compare/v0.2.3...v0.3.0
[0.2.3]: https://github.com/SO4-Markets/interface/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/SO4-Markets/interface/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/SO4-Markets/interface/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/SO4-Markets/interface/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/SO4-Markets/interface/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/SO4-Markets/interface/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/SO4-Markets/interface/releases/tag/v0.1.0

# Changelog

Fixture for the DX-005 parser tests: covers yanked releases, missing PR
links, absent areas, pre-tooling prose entries, inline markdown, breaking
entries, and semver ordering (0.10.0 above 0.9.0). Not consumed by the app.

## [Unreleased]

### Added

### Fixed

## [0.10.0] - 2026-08-24

### Added

- Trigger orders on the trade panel with `take-profit` and stop-loss. ([#512](https://github.com/SO4-Markets/interface/pull/512))
- **BREAKING:** Order payload now requires a `slippage` field. ([#515](https://github.com/SO4-Markets/interface/pull/515))

### Fixed

- Liquidation price line no longer drifts after a theme switch. ([#514](https://github.com/SO4-Markets/interface/pull/514))
- Pool APY calculation handles zero-volume periods.

## [0.9.0] - 2026-08-20 [YANKED]

### Changed

- Withdrawn release: gas estimation rework. ([#501](https://github.com/SO4-Markets/interface/pull/501))

## [0.3.2] - 2026-08-11

The first tooling-era release with hand-written historical entries and no
structured metadata at all.

### Added

- **Core Trading:** Long and short perpetual positions with market, limit, and trigger order types.
- **Chart:** Real-time price feed with candlestick charting.

### Security

- Patched dependency audit findings.

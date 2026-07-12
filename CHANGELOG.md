# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Added
- Project foundation and governance documents: README, MANIFESTO, VISION, ROADMAP, NON_GOALS, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, ARCHITECTURE_DECISIONS.
- Quick Capture and Structured Capture forms, backed by browser local storage (`app/js/storage.js`, `app/js/ui.js`, `app/js/app.js`, `app/index.html`, `app/css/styles.css`).
- Defined the capture data standard (`docs/capture-standard.md`).

### Removed
- `app/data/sample.csv`, a duplicate of `examples/sample-thoughts.csv` with inconsistent columns (flagged in the TR-001.1 audit).

## v0.1.0

### Added
- Initial project structure.

# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Added
- Project foundation and governance documents: README, MANIFESTO, VISION, ROADMAP, NON_GOALS, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, ARCHITECTURE_DECISIONS.
- Quick Capture and Structured Capture forms, backed by browser local storage (`app/js/storage.js`, `app/js/ui.js`, `app/js/app.js`, `app/index.html`, `app/css/styles.css`).
- Defined the capture data standard (`docs/capture-standard.md`).

### Removed
- `app/data/sample.csv`, a duplicate of `examples/sample-thoughts.csv` with inconsistent columns (flagged in the TR-001.1 audit).

### Changed
- Reworked the capture screen to feel like writing rather than filling out a form: labels are visually hidden (placeholder + accessible label only), Topic is tucked behind a "+ Topic" toggle in both modes instead of always visible, textareas auto-grow instead of scrolling, and native validation popups are gone in favor of silent no-ops on empty submit.
- Quick Capture now saves on `Enter` (like sending a message); `Shift+Enter` inserts a line break. Structured Capture keeps `Enter` as a line break and saves on `Ctrl`/`Cmd+Enter`, since it's a more deliberate, multi-line entry.
- Documented these interaction patterns in `docs/design-principles.md`.

## v0.1.0

### Added
- Initial project structure.

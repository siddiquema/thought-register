# Roadmap

Thought Register is built incrementally, one milestone at a time. Nothing in a future milestone is started until the current one ships.

## v0.1 — Capture Release (shipped)

- Quick Capture
- Structured Capture
- Local Storage
- Markdown Export
- CSV Export
- Search

This was the entire v0.1 scope, and it's complete. Dark Mode and Installable PWA were originally scoped here but were moved out during release review (see [docs/release-review-v0.1.md](docs/release-review-v0.1.md)) — neither was built, and shipping a "Capture Release" that does exactly what its name says was judged better than delaying release for unrelated features.

## v0.2 — Installable PWA

- A valid web app manifest with real icons
- A working service worker with an offline-caching strategy
- An install flow, on desktop and mobile

## Beyond v0.2

Not yet scoped, not yet designed, and not started until a milestone is explicitly opened for them:

- v0.3 — Search refinements
- v0.4 — Export refinements

## Future Enhancements

Real ideas, wanted, but not yet scheduled to a version:

- Dark Mode
- A real onboarding / user guide
- Graceful handling when local storage is full or unavailable
- Real logo/icon assets and a favicon

See [docs/release-review-v0.1.md](docs/release-review-v0.1.md) for the complete technical debt and future enhancements list from release review.

## Explicitly not on this roadmap

The following are real ideas, deliberately deferred. None of them will be implemented unless separately requested and evaluated against the project's principles:

- Voice Capture
- Image Capture
- GitHub Sync
- AI Classification
- AI Summaries
- Knowledge Graph
- Multi-user
- Cloud Sync
- Plugins

See [NON_GOALS.md](NON_GOALS.md) for the difference between "deferred" and "will never happen."

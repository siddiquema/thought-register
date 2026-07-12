# Contributing

Every contribution should make capturing knowledge easier — not add a feature for its own sake.

## Before you open a PR

Ask: **does this help someone capture knowledge faster?**

If yes, proceed. If no, or if you're unsure, open an issue first and describe the problem you're solving. Features outside the current [ROADMAP.md](ROADMAP.md) milestone, or anything listed in [NON_GOALS.md](NON_GOALS.md), will not be merged regardless of code quality.

## Ground rules

- **Stack**: HTML, CSS, vanilla JavaScript. No frameworks, no build step, no Node backend, no database, no authentication, no cloud dependency, no analytics, no telemetry.
- **Dependencies**: avoid adding any. If one seems necessary, explain why in the PR description.
- **Simplicity**: prefer readability over cleverness. Keep functions small. Avoid duplication. Use descriptive names.
- **Comments**: explain *why*, not *what*. If removing a comment wouldn't confuse a future reader, don't add it.

## Commits

- Commit frequently; each commit represents one logical change.
- Write meaningful, present-tense messages: `Add quick capture screen`, `Fix offline export bug`, not `updates` or `wip`.
- Avoid large, multi-purpose commits.

## Testing your change

Before submitting, check your change on:

- Desktop
- Android
- iPhone
- Tablet
- Light mode and dark mode
- Offline mode

## Documentation

If your change affects behavior, update the relevant document in the same PR: [README.md](README.md), [ROADMAP.md](ROADMAP.md), [CHANGELOG.md](CHANGELOG.md), or the files under `docs/`. Documentation is part of the product, not an afterthought.

## Scope discipline

The best contribution is sometimes the one that's proposed and then withdrawn, because it doesn't belong. Protecting the project's simplicity is as valuable as adding to it.

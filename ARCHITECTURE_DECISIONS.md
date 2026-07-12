# Architecture Decisions

A short log of significant technical decisions and the reasoning behind them. New entries are appended; existing entries are not rewritten after the fact — if a decision changes, add a new entry that supersedes it.

## ADR-001: Vanilla HTML/CSS/JS, no framework

**Decision**: Build with plain HTML, CSS, and vanilla JavaScript. No React, Angular, Vue, or similar.

**Why**: Frameworks add build tooling, dependency churn, and long-term maintenance risk that outlast their benefit for a project this size. Plain web technology is stable for a decade or more and keeps the project approachable to any contributor who knows HTML/CSS/JS.

## ADR-002: No backend, no database, no accounts

**Decision**: The application is entirely client-side. No server, no user accounts, no authentication.

**Why**: Removing the backend removes an entire category of cost, risk, and vendor lock-in. It also guarantees offline-first behavior by construction rather than as an added feature, and keeps user data under the user's control by default.

## ADR-003: Local storage as the source of truth

**Decision**: Captured thoughts are stored locally on the device (browser storage), not synced to a cloud service.

**Why**: Privacy First and No Vendor Lock-in are core principles. A local-only store means no data leaves the device unless the user explicitly exports it. Cloud Sync remains a deferred idea (see [ROADMAP.md](ROADMAP.md)), not a default assumption.

## ADR-004: Markdown as the primary export format

**Decision**: Thoughts export to Markdown (and CSV for structured/tabular use), not a proprietary format.

**Why**: Markdown is plain text, human-readable, durable, and portable across tools. It directly supports Export Everything and No Vendor Lock-in — a user's data should never be trapped by this project.

## ADR-005: Installable PWA instead of native apps

**Decision**: Ship as a Progressive Web App rather than separate native mobile/desktop apps.

**Why**: A single PWA codebase covers desktop, Android, and iPhone without multiplying maintenance surface, keeping with Mobile First and Lightweight while avoiding app-store dependencies.

## ADR-006: Application source lives at the repository root, not in `app/`

**Decision**: `index.html`, `css/`, `js/`, `manifest.json`, `service-worker.js`, and `assets/` moved from `app/` to the repository root. Governance docs, `docs/`, `examples/`, `templates/`, and `media/` are unchanged.

**Why**: GitHub Pages serves a repository from the branch root (or a `/docs` folder, already in use for project documentation). With the app under `app/`, the live site could only be reached at `.../thought-register/app/`, not `.../thought-register/`. Moving the source to root lets users visit the plain repository URL directly. A GitHub Actions build step to publish just `app/` as the Pages artifact was considered and rejected — it would add CI/build machinery this project deliberately doesn't have (see ADR-001), just to avoid a one-time file move.

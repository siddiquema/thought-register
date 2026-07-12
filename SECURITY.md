# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities privately — do not open a public issue.

Email: **siddiquema@gmail.com**

Include a description of the issue, steps to reproduce, and its potential impact. You should expect an acknowledgment within a few days.

## Scope

Thought Register runs entirely client-side: no backend, no accounts, no server-stored data. Reports most relevant to this project concern:

- Data leakage from local storage or exports
- Cross-site scripting (XSS) in captured content rendering
- Service worker or PWA caching issues that expose or corrupt user data
- Supply-chain risk from any dependency the project adds

## Disclosure

Please allow time for a fix before any public disclosure. Coordinated disclosure is appreciated and will be credited in the [CHANGELOG.md](CHANGELOG.md) unless you prefer to remain anonymous.

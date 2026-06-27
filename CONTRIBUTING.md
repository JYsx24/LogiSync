# Contributing to LogiSync

Thank you for taking the time to contribute! This document covers everything you need to get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Branch Naming](#branch-naming)
- [Commit Style](#commit-style)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to uphold it.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/LogiSync.git
   cd LogiSync/web-app
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Configure** your Firebase project — copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example web-app/.env
   ```
5. **Run** the dev server:
   ```bash
   npm run dev
   ```

## How to Contribute

### Reporting Bugs

Open a [bug report](https://github.com/JYsx24/LogiSync/issues/new?template=bug_report.md) and fill in the template. Include steps to reproduce, expected vs actual behaviour, and your browser/OS.

### Suggesting Features

Open a [feature request](https://github.com/JYsx24/LogiSync/issues/new?template=feature_request.md). Describe the problem you're solving, not just the solution.

### Submitting Code

- For small fixes (typos, single-line bugs) — open a PR directly.
- For anything larger — open an issue first to discuss the approach before writing code.

## Branch Naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/short-description` | `feat/barcode-scanner` |
| Bug fix | `fix/short-description` | `fix/stats-bar-gap` |
| Docs | `docs/short-description` | `docs/update-readme` |
| Refactor | `refactor/short-description` | `refactor/split-app-jsx` |

## Commit Style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add barcode scanner support
fix: correct stats bar sticky position on mobile
docs: add Firebase setup guide to README
refactor: extract DashboardStats into its own component
chore: update Vite to v8
```

- Use the **imperative mood** in the subject line ("add" not "added")
- Keep the subject under **72 characters**
- Reference issues where relevant: `fix: correct layout (#42)`

## Pull Request Process

1. Make sure your branch is up to date with `master` before opening a PR
2. Fill in the PR template completely
3. Link the related issue (if any) with `Closes #123`
4. Keep PRs focused — one feature or fix per PR
5. A maintainer will review and may request changes
6. Once approved, the PR will be squash-merged into `master`

## Code Style

- **Formatting** — no Prettier config is enforced, but match the surrounding code style
- **Components** — one component per file, named to match the file (e.g. `DashboardStats.jsx` exports `DashboardStats`)
- **State** — keep state as local as possible; lift only when two or more siblings need it
- **CSS** — use Tailwind utility classes; use `var(--token)` CSS custom properties for colours so light/dark mode works automatically
- **Translations** — any user-visible string must have an entry in both `en` and `zh` in the `translations` object inside `App.jsx`
- **No comments** — write self-documenting code; only add a comment when the *why* is non-obvious

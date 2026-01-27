---
title: CI/CD Pipelines
description: How we test, build, and release Cherit automatically.
---

We use GitHub Actions to automate testing and releasing. Here is how our pipeline strategies work depending on the branch.

## 1. Pull Requests (Sanity Checks)

**Trigger:** Opening a PR to `main` or `staging`.

Before merging code, we ensure it compiles to prevent breaking the build.

- **App:** Runs a debug build on Linux/macOS/Windows/Android (both x86_64, arm) to verify Rust and Svelte compilation.
- **Site:** Runs `bun run build` to ensure the Astro site builds without errors.

## 2. Staging Branch (Beta Testing)

**Trigger:** Pushing to `staging`.

This is our "Test Flight" zone.

- **App:** Builds **Debug** artifacts (unsigned) for all platforms. These are available in the GitHub Actions "Summary" tab for testers to download and try.
- **Site:** Runs `bun run build` to ensure the Astro site builds without errors (same as PR check).

## 3. Main Branch (Production)

**Trigger:** Pushing to `main`.

This is the "Live" zone.

- **App Release:** Builds optimized **Release** binaries, signs them (Android/macOS), and creates a Draft Release on GitHub.
- **Site Deploy:** Builds the documentation site and deploys it to GitHub Pages.

## Quick Reference

| Goal                | Workflow File           | Triggers     |
| :------------------ | :---------------------- | :----------- |
| **Test App Logic**  | `app-build-debug.yml`   | PRs, Staging |
| **Test Site Build** | `site-check.yml`        | PRs, Staging |
| **Release App**     | `app-build-release.yml` | Main         |
| **Deploy Site**     | `site-deploy.yml`       | Main         |

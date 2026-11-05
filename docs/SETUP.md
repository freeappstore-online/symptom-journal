# Project setup — 3 November 2026

## Scope and outcome

Local development foundation in `/Users/vuthanhvannguyen/symptom-map`. Imported the official standalone template at commit `d5e7eae` (31 October 2026). No publishing, GitHub repository provisioning, remote push or commit was performed. Diary/About are starter routes, not a working symptom recorder. Template app icons remain placeholders.

## Decisions and sources

- **Official standalone template.** Reused the maintained pnpm workspace, React, TypeScript, Vite, Tailwind, MIT license, PWA setup and GitHub Actions. Sources: [Project Structure](https://freeappstore.online/skills.md#project-structure), [official template](https://github.com/freeappstore-online/template-standalone/tree/d5e7eae). The template currently resolves TypeScript 6/Vite 8; the guide's Tech Stack paragraph still lists TypeScript 5.7/Vite 6. Retained the template's reproducible versions rather than downgrading an upstream-tested stack. Confirm this discrepancy with the supervisor if exact major versions are mandatory.
- **SDK Shell and PageHeader.** Kept Shell as the root and use its navigation, themes, toast/error infrastructure and page headings. No custom bottom dock or header. Sources: [Shell](https://freeappstore.online/skills.md#shell----the-app-wrapper-every-app-starts-here), [getting started](https://docs.freeappstore.online/getting-started/#build-your-app-on-the-shell).
- **Muted teal without decorative clutter.** Brand lives in light/dark CSS tokens; React uses Tailwind token utilities. Opaque floating surfaces, visible focus outlines, responsive content. Manrope/Fraunces references retained. Sources: [Styling](https://freeappstore.online/skills.md#styling-required), [Brand Design](https://freeappstore.online/skills.md#brand-design), plus the user's selected teal reference and concise-copy preference.
- **Zero analytics is authoritative.** Removed the template's platform analytics loader. No additional tracking, analytics or remote error-reporting provider. Source: [Privacy Rules](https://freeappstore.online/skills.md#privacy-rules) and explicit user instruction on 3 November.
- **Disable SDK logging too.** SDK 0.16.0's Logger automatically registers error listeners, saves logs locally and periodically uploads them if authenticated. It offers no opt-out in FasInitOptions. A tracked pnpm patch disables constructor capture, all log additions and uploadBatch (including explicit flush). The SDK is pinned to 0.16.0; privacy tests exercise the real patched logger with a simulated signed-in session and assert no collection, storage or network calls. Do not remove this patch without a supported replacement. Sources: installed SDK `dist/logger.js`, `dist/types.d.ts`, [pnpm patch support](https://pnpm.io/settings#patcheddependencies). This is an app-specific compatibility measure, not a claim that the upstream SDK is privacy-disabled.
- **No custom backend or required account.** No auth gate, KV, public collections or cloud sync added. Initial diary persistence is planned as namespaced/versioned localStorage because the guide explicitly names it for standalone apps. No profiles or symptoms are stored yet; JSON backup/restore should accompany persistence. Sources: [Privacy Rules](https://freeappstore.online/skills.md#privacy-rules), [SDK Setup](https://freeappstore.online/skills.md#sdk-setup-freeappstoresdk). Full guide also explicitly permits IndexedDB under Free platform boundaries; localStorage is a starting choice, not a browser limitation.
- **PWA foundation.** Kept manifest, service-worker generation, SPA offline fallback and mobile metadata. No browser permissions requested. Offline installation still needs browser validation. Sources: [Compliance Checks](https://freeappstore.online/skills.md#compliance-checks-automated-on-push), [Permissions](https://docs.freeappstore.online/permissions/).
- **Review before deployment.** Work is on `codex/project-setup` per the internship's branch/PR instructions, which take precedence over the guide's trunk-based recommendation. The template remote is renamed `upstream` with a disabled push URL. No app origin is configured because no destination was supplied. The inherited deploy workflow is present for eventual platform hosting but has not run. Sources: user's internship responsibilities, [How Deployment Works](https://freeappstore.online/skills.md#how-deployment-works), [Provisioning](https://freeappstore.online/skills.md#provisioning-a-new-app-or-game).
- **Private notes stay private.** No personal discussion log copied into this repo; PERSONAL_DECISIONS.md is gitignored defensively.

## Important SDK boundary

Shell still displays the SDK's optional platform sign-in control. It is not a local diary-profile tile and does not enable symptom syncing. The SDK can make authentication/membership requests if a platform session exists or the user chooses sign-in. Those are distinct from analytics; the logger patch does not disable account features. Before real health data, confirm the intended standalone account experience with the platform team. Do not claim that SDK Shell makes zero network requests. Google Fonts remains as the guide's permitted external font service.

The current template's exact versions, its analytics loader and automatic SDK logger differ from portions of the prose guide. These differences are recorded here rather than silently treating them as equivalent.

## Verification

Run `corepack pnpm install --frozen-lockfile`, `corepack pnpm typecheck` and `corepack pnpm test`. The test command includes production build, inherited SDK/Tailwind styling checks and app privacy checks. See the completion report for actual results. `fas check` and `fas screencheck` remain pre-publish checks, not claims of passed platform certification.

## Next development scope

Choose/create local profile → confirm demographics → adult female surface body map → area plus optional focal spot (or no location) → symptom, rating and notes → saved history. Charts, JSON backup/restore and PDF export follow. Familiar region labels, no organ diagnosis, no treatment/urgency claims. No anatomically reviewed artwork is included in this setup.

## Open questions

1. Final app ID and eventual repository URL; no console account is needed for local development.
2. Supervisor clarification on exact tool versions versus the maintained template.
3. Supported SDK option for a standalone Shell without account controls or automatic logging; keep our privacy patch until resolved.

## Verified results

- Pinned pnpm 10.30.3 frozen-lockfile installation: passed.
- TypeScript project build/typecheck: passed.
- Production build and PWA generation: passed; initial JS approximately 75.86 kB gzip according to Vite, below the 300 kB cap.
- All four tests passed: two inherited styling tests, no remote executable HTML scripts, and no SDK logger capture/storage/upload even with a simulated signed-in session.
- Official `fas check`: all hard checks passed on the first run; its two warnings prompted an explicit 320px minimum width and a clearer SKILLS.md pointer. Final result is recorded in the completion report.
- `git diff --check`: passed.
- Browser viewport, offline-install, keyboard/screen-reader and real-device checks have not been performed; do not infer these from a successful static check.

## Product implementation follow-up

The foundation-only status above describes the initial setup. Profiles, persistent diary entries, visual location selection, JSON backup/restore and printable reports have since been implemented. See [PRODUCT.md](PRODUCT.md) for current scope and verification.

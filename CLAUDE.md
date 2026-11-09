# Symptom Journal

A mobile-first personal symptom diary, with adult female and male surface body mapping.

- App ID: `symptom-journal`
- Dev: `corepack pnpm install && corepack pnpm dev`
- Validate: `corepack pnpm typecheck && corepack pnpm test`

Free, MIT-licensed. Read the platform [SKILLS.md](https://freeappstore.online/skills.md) before changes. See the [starter contract](https://github.com/freeappstore-online/platform/blob/main/docs/composable-starter-contract.md) for shared conventions.

## Project-specific decisions

- Zero analytics and zero remote error reporting. Preserve the tracked SDK logger patch and privacy tests; do not add sensitive values to logs or URLs.
- Local profiles are separate diary records, not platform accounts. Persistence uses validated, versioned localStorage with stale-tab protection; no public collections or cloud sync.
- Use familiar body-part names. Record area and optional focal spot without diagnosis, organ identification or acute-pain classification.
- Keep copy concise and use the existing muted teal tokens.
- Follow the internship's branch/PR review requirement where it conflicts with the platform's trunk-based guide. No push or publishing as part of local setup.
- Read docs/SETUP.md for source links, verified checks and unresolved SDK behavior.

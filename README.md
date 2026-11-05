# SymptomMap

A mobile-first personal symptom diary for FreeAppStore. A working local-first development build.

## Run locally

Use Node 22+ and pnpm 10.30.3 (the version declared in package.json).

```sh
corepack pnpm install
corepack pnpm dev
```

Open the URL printed by Vite. Stop the server with Ctrl+C.

## Validate

```sh
corepack pnpm typecheck
corepack pnpm test
```

Implemented: local profiles and age/sex confirmation, adult female front/back body map, area/spot refinement, optional no-location entry, symptom severity/time/duration/notes, physical symptoms and mood as an optional third step, editing/deletion, profile-specific history and search, JSON backup/restore, and printable reports (browser Save as PDF). Data persists in versioned localStorage without an account. No analytics or remote error reporting.

Body artwork is an original approximate prototype, not reviewed clinical anatomy. Other age/sex profiles use a body-part list. Shading and markers are not constrained to the body outline. Charts, reviewed age-specific artwork, direct PDF generation and report date filters are not implemented yet.

Use fictional data while evaluating this development build. Local profiles are not password-protected. Keep a JSON backup; browser site-data removal or device loss can erase the diary. Backups contain all local profiles. No automatic sync or recovery.

See [product validation and decisions](docs/PRODUCT.md).

Read [setup decisions and evidence](docs/SETUP.md) before the next development step.

MIT licensed. [FreeAppStore guide](https://freeappstore.online/skills.md).


### 3D anatomy prototype
Adult female and male body selection use a rotatable MakeHuman-derived CC0 surface, with optional surface area and point marking. A separate BodyParts3D right-knee bone reference is available. Models are generic and region boundaries remain unreviewed clinically. See [anatomy decisions](docs/ANATOMY.md) and [asset credits/licences](web/public/anatomy/SOURCES.md). App code is MIT; third-party model assets retain the licences listed there.

Adults can choose their reference body illustration independently of sex in profile setup. Under-18 profiles use the body-part list.

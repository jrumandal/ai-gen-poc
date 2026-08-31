# @microfrontend/mobile

Capacitor hybrid wrapper around the **shell** web app. It packages the shell's
production build into a native Android / iOS shell so the micro-frontend
experience runs inside a native app (with native plugins such as the camera).

> **This repo is a thin wrapper.** It contains **no app code** — the UI is the
> shell's build output. The native `android/` and `ios/` projects are generated
> by `cap add` and are **gitignored** (regenerated on each machine).

## How it works

1. The **shell** repo builds its web app to `dist/shell/browser/`.
2. `pnpm build-web` (→ `scripts/sync-mobile-web.mjs`) copies that build into
   this repo's `web/` directory (the Capacitor `webDir`), rewriting the SSR
   client entry `index.csr.html` → `index.html`.
3. `cap sync` copies `web/` into the native projects; `cap build` produces the
   native artifacts.

```
shell (dist/shell/browser)  ──build-web──▶  mobile/web/  ──cap sync──▶  android/ + ios/
```

## Layout

| Path | Purpose |
| --- | --- |
| `capacitor.config.ts` | Capacitor config (appId `com.microfrontend.shell`, `webDir: web`, camera plugin) |
| `scripts/sync-mobile-web.mjs` | Copies the shell build into `web/` (resolves `SHELL_BUILD_DIR` or `../shell/dist/shell/browser`) |
| `web/` | **Generated** — shell build output (gitignored) |
| `android/`, `ios/` | **Generated** by `cap add` (gitignored) |

## Prerequisites

- Node 22, pnpm 11.24.0
- **JDK 21** (required by Android Gradle Plugin 8.13.0)
- Android SDK (for `cap build android`) / Xcode (for `cap build ios`)
- A built shell (or a sibling `../shell` checkout)

## Commands

| Command | Description |
| --- | --- |
| `pnpm build-web` | Sync the shell build into `web/` |
| `pnpm add:android` / `pnpm add:ios` | Generate the native projects (first time) |
| `pnpm sync` | `cap sync` — copy `web/` into the native projects |
| `pnpm build-android` / `pnpm build-ios` | Build native artifacts |
| `pnpm open-android` / `pnpm open-ios` | Open in Android Studio / Xcode |

Typical flow:

```bash
# 1. build the shell (in the shell repo)
cd ../shell && pnpm build
# 2. sync + package
cd ../mobile
pnpm build-web
pnpm add:android   # first time only
pnpm sync
pnpm open-android  # build/run in Android Studio
```

## CI

`ci.yml` is **ci-only** (no native build — GitHub runners have no Android
SDK/Xcode by default). It checks out `mobile` + `shell`, builds the shell, runs
`pnpm build-web`, typechecks `capacitor.config.ts`, and verifies the `web/`
entry. Native builds (`cap build android`/`ios`) run locally or in a dedicated
release pipeline.

## Gotchas

- **`index.csr.html` → `index.html`:** the shell is an Angular SSR app; its
  client entry is `index.csr.html`. The sync script renames it to `index.html`
  so Capacitor serves it.
- **`cap add` before `cap sync`:** the native projects don't exist until you
  run `pnpm add:android` / `pnpm add:ios` once.
- **`web/`, `android/`, `ios/` are gitignored** — they are generated artifacts.

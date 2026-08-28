#!/usr/bin/env node
/**
 * Sync the shell's production web build into the Capacitor `webDir`.
 *
 * The shell (Angular SSR) emits its static client bundle to
 * `dist/apps/shell/browser/`. Capacitor expects the web assets under
 * `apps/mobile/web/` (see `capacitor.config.ts` → `webDir: 'web'`).
 *
 * Because the shell is built in SSR mode (`outputMode: 'server'`), Angular emits
 * the client-side entry as `index.csr.html` rather than `index.html`. Capacitor
 * (and the WebView) expect `index.html`, so this script copies the CSR entry to
 * `index.html` after syncing the rest of the build output.
 *
 * Usage: `node scripts/sync-mobile-web.mjs`
 */
import { cpSync, rmSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const sourceDir = join(repoRoot, 'dist', 'apps', 'shell', 'browser');
const targetDir = join(repoRoot, 'apps', 'mobile', 'web');

if (!existsSync(sourceDir)) {
  console.error(
    `✖ Shell build output not found at ${sourceDir}.\n` +
      '  Run `npx nx build shell` first (or use `npx nx run mobile:build-web`).',
  );
  process.exit(1);
}

// Replace any previous web contents with the fresh shell build.
rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true });

// The shell is built in SSR mode, so the client entry is `index.csr.html`.
// Capacitor / the WebView expect `index.html` — copy the CSR entry over it.
const csrEntry = join(targetDir, 'index.csr.html');
const indexEntry = join(targetDir, 'index.html');
if (existsSync(csrEntry) && !existsSync(indexEntry)) {
  copyFileSync(csrEntry, indexEntry);
  console.log('✔ Created index.html from index.csr.html (SSR client entry)');
}

console.log(`✔ Synced shell build → ${targetDir}`);

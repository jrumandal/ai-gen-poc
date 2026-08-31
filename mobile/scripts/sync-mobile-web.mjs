#!/usr/bin/env node
/**
 * Sync the shell's production web build into the Capacitor `webDir`.
 *
 * The shell (Angular SSR) emits its static client bundle to a `browser/`
 * directory. Capacitor expects the web assets under `web/` (see
 * `capacitor.config.ts` → `webDir: 'web'`).
 *
 * Because the shell is built in SSR mode (`outputMode: 'server'`), Angular
 * emits the client-side entry as `index.csr.html` rather than `index.html`.
 * Capacitor (and the WebView) expect `index.html`, so this script copies the
 * CSR entry to `index.html` after syncing the rest of the build output.
 *
 * Source directory resolution (first match wins):
 *   1. `SHELL_BUILD_DIR` env var (explicit path to the shell `browser/` output)
 *   2. `../shell/dist/shell/browser` (sibling shell repo, default)
 *
 * Usage: `node scripts/sync-mobile-web.mjs`
 */
import { cpSync, rmSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const candidates = [
  process.env.SHELL_BUILD_DIR,
  join(repoRoot, '..', 'shell', 'dist', 'shell', 'browser'),
].filter(Boolean);

const sourceDir = candidates.find((dir) => existsSync(dir));

if (!sourceDir) {
  console.error(
    '✖ Shell build output not found. Looked in:\n' +
      candidates.map((d) => `   - ${d}`).join('\n') +
      '\n  Build the shell first (see the shell repo), or set SHELL_BUILD_DIR ' +
      'to the shell `browser/` output directory.'
  );
  process.exit(1);
}

const targetDir = join(repoRoot, 'web');

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

#!/usr/bin/env node
/**
 * typecheck.mjs — aggregate TypeScript type-check across every project.
 *
 * Nx projects here use solution-style `tsconfig.json` files (empty `include`,
 * project references), so `tsc --noEmit` on the root config checks nothing.
 * Instead we type-check each project's *leaf* configs directly:
 *   - apps  -> tsconfig.app.json + tsconfig.spec.json
 *   - libs  -> tsconfig.lib.json  + tsconfig.spec.json
 *   - e2e   -> tsconfig.spec.json
 *   - mobile-> tsconfig.json (only includes capacitor.config.ts)
 *
 * Runs the local `tsc` (node_modules/typescript) with `--noEmit` per config,
 * in a bounded parallel pool, and reports a per-project PASS/FAIL summary.
 *
 * Usage: `node scripts/typecheck.mjs`  (or `nx typecheck` / `pnpm typecheck`)
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const tscBin = path.join(root, 'node_modules', '.bin', isWin ? 'tsc.cmd' : 'tsc');

/** project name -> { dir, configs: [leaf tsconfig basenames] } */
const PROJECTS = [
  { name: 'shell', dir: 'apps/shell', configs: ['tsconfig.app.json', 'tsconfig.spec.json'] },
  { name: 'api-gateway', dir: 'apps/api-gateway', configs: ['tsconfig.app.json', 'tsconfig.spec.json'] },
  { name: 'mobile', dir: 'apps/mobile', configs: ['tsconfig.json'] },
  { name: 'catalog-mf', dir: 'libs/mf/catalog', configs: ['tsconfig.lib.json', 'tsconfig.spec.json'] },
  { name: 'cart-mf', dir: 'libs/mf/cart', configs: ['tsconfig.lib.json', 'tsconfig.spec.json'] },
  { name: 'user-mf', dir: 'libs/mf/user', configs: ['tsconfig.lib.json', 'tsconfig.spec.json'] },
  { name: 'shared', dir: 'libs/server/shared', configs: ['tsconfig.lib.json', 'tsconfig.spec.json'] },
  { name: 'catalog-svc', dir: 'libs/server/catalog-svc', configs: ['tsconfig.app.json', 'tsconfig.spec.json'] },
  { name: 'cart-svc', dir: 'libs/server/cart-svc', configs: ['tsconfig.app.json', 'tsconfig.spec.json'] },
  { name: 'user-svc', dir: 'libs/server/user-svc', configs: ['tsconfig.app.json', 'tsconfig.spec.json'] },
  { name: 'catalog-svc-e2e', dir: 'libs/server/catalog-svc-e2e', configs: ['tsconfig.spec.json'] },
  { name: 'api-gateway-e2e', dir: 'libs/server/api-gateway-e2e', configs: ['tsconfig.spec.json'] },
  { name: 'contracts', dir: 'libs/shared/contracts', configs: ['tsconfig.lib.json', 'tsconfig.spec.json'] },
  { name: 'db', dir: 'libs/shared/db', configs: ['tsconfig.lib.json', 'tsconfig.spec.json'] },
  { name: 'design-tokens', dir: 'libs/shared/design-tokens', configs: ['tsconfig.lib.json', 'tsconfig.spec.json'] },
  { name: 'event-bus', dir: 'libs/shared/event-bus', configs: ['tsconfig.lib.json', 'tsconfig.spec.json'] },
  { name: 'bridge', dir: 'libs/shared/bridge', configs: ['tsconfig.lib.json', 'tsconfig.spec.json'] },
];

function runTsc(configPath) {
  return new Promise((resolve) => {
    const child = spawn(tscBin, ['--noEmit', '-p', configPath], {
      cwd: root,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout?.on('data', (d) => (out += d));
    child.stderr?.on('data', (d) => (out += d));
    child.on('error', (err) => resolve({ code: 1, out: err.message }));
    child.on('exit', (code) => resolve({ code: code ?? 1, out }));
  });
}

async function main() {
  const results = [];
  const concurrency = 4;
  let idx = 0;

  async function worker() {
    while (idx < PROJECTS.length) {
      const project = PROJECTS[idx++];
      const configFiles = project.configs.filter((c) =>
        fs.existsSync(path.join(root, project.dir, c)),
      );
      const checks = await Promise.all(
        configFiles.map((c) => runTsc(path.join(project.dir, c))),
      );
      const failed = checks.filter((c) => c.code !== 0);
      results.push({ name: project.name, failed, output: failed.map((c) => c.out).join('\n') });
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, PROJECTS.length) }, worker));

  const failed = results.filter((r) => r.failed.length > 0);
  console.log('\n=== typecheck summary ===');
  for (const r of results) {
    console.log(`${r.failed.length === 0 ? 'PASS' : 'FAIL'}  ${r.name}`);
    if (r.failed.length > 0) {
      console.log(r.output);
    }
  }
  console.log(
    `\n${results.length - failed.length}/${results.length} projects passed type-check.`,
  );
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(`[typecheck] Fatal: ${err?.message ?? err}`);
  process.exit(1);
});

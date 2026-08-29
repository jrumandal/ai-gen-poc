#!/usr/bin/env node
/**
 * serve-all.mjs — one-command dev orchestrator for the micro-frontend stack.
 *
 * Starts, in dependency order:
 *   1. PostgreSQL (best-effort `docker compose up -d`; skipped if docker is
 *      unavailable, e.g. inside WSL where Docker Desktop runs on the Windows
 *      host — the DB is then assumed to already be reachable at localhost:5432).
 *   2. The three NestJS micro-services (catalog-svc :4001, cart-svc :4002,
 *      user-svc :4003) in parallel. Each `nx serve` target builds first
 *      (dependsOn: build) then runs the node server.
 *   3. Waits until all three service ports are accepting connections.
 *   4. The Apollo gateway (api-gateway :4200). It introspects the three
 *      services on module init and throws if any is unreachable, so it MUST
 *      start only after the services are listening.
 *   5. The Angular shell dev-server on :4300 (moved off :4200 to avoid
 *      colliding with the gateway). The shell's browser-side GraphQL client
 *      still targets the gateway at http://localhost:4200/graphql.
 *
 * All child output is streamed with a `[name]` prefix. Ctrl+C (SIGINT/SIGTERM)
 * tears down every child process.
 *
 * Usage: `node scripts/serve-all.mjs`  (or `nx serve:all` / `pnpm serve:all`)
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const nxBin = path.join(root, 'node_modules', '.bin', isWin ? 'nx.cmd' : 'nx');

const PORTS = {
  catalog: 4001,
  cart: 4002,
  user: 4003,
  gateway: 4200,
  shell: 4300,
};

const children = [];
let shuttingDown = false;

function log(prefix, chunk) {
  for (const line of chunk.toString().split('\n')) {
    if (line.trim()) process.stdout.write(`[${prefix}] ${line}\n`);
  }
}

/** Spawn a long-running child, stream its output, and track it for teardown. */
function start(name, args, env = {}) {
  const child = spawn(nxBin, args, {
    cwd: root,
    shell: true,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout?.on('data', (d) => log(name, d));
  child.stderr?.on('data', (d) => log(name, d));
  child.on('error', (err) => {
    console.error(`[serve-all] failed to start ${name}: ${err.message}`);
    if (!shuttingDown) shutdown(1);
  });
  child.on('exit', (code) => {
    if (!shuttingDown) {
      console.error(`[serve-all] ${name} exited unexpectedly (code ${code}). Shutting down.`);
      shutdown(code ?? 1);
    }
  });
  children.push(child);
  return child;
}

/** Resolve once `host:port` accepts a TCP connection, else reject after timeout. */
function waitForPort(port, timeoutMs = 600_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect({ port, host: '127.0.0.1' });
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Timed out waiting for port ${port} to be ready.`));
        } else {
          setTimeout(attempt, 500);
        }
      });
    };
    attempt();
  });
}

/**
 * Resolve a usable `docker` executable. Inside WSL the `docker` shim is often
 * missing, but Docker Desktop on the Windows host exposes `docker.exe` under
 * the user's AppData — scan the mounted Windows drives for it before giving up.
 */
function resolveDockerBin() {
  if (process.platform === 'linux' && process.env.WSL_DISTRO_NAME) {
    for (const drive of ['c', 'd', 'e']) {
      const usersRoot = `/mnt/${drive}/Users`;
      let users = [];
      try {
        users = fs.readdirSync(usersRoot);
      } catch {
        continue;
      }
      for (const user of users) {
        const exe = `${usersRoot}/${user}/AppData/Local/Programs/DockerDesktop/resources/bin/docker.exe`;
        if (fs.existsSync(exe)) return exe;
      }
    }
  }
  return 'docker';
}

/** Best-effort DB start: try `docker compose up -d`, warn (not fail) if unavailable. */
function startDb() {
  return new Promise((resolve) => {
    const dockerBin = resolveDockerBin();
    if (!dockerBin) {
      console.warn('[serve-all] docker not found — assuming the DB is already running.');
      resolve();
      return;
    }
    let docker;
    try {
      docker = spawn(dockerBin, ['compose', 'up', '-d'], {
        cwd: root,
        shell: true,
        stdio: 'pipe',
      });
    } catch {
      console.warn('[serve-all] docker not found — assuming the DB is already running.');
      resolve();
      return;
    }
    let out = '';
    docker.stdout?.on('data', (d) => (out += d));
    docker.stderr?.on('data', (d) => (out += d));
    docker.on('error', () => {
      console.warn('[serve-all] docker not available — assuming the DB is already running.');
      resolve();
    });
    docker.on('exit', (code) => {
      if (code === 0) {
        console.log('[serve-all] DB started via `docker compose up -d`.');
      } else {
        console.warn(
          `[serve-all] DB start skipped (docker exit ${code}) — assuming the DB is already running.\n${out.trim()}`,
        );
      }
      resolve();
    });
  });
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\n[serve-all] Shutting down…');
  for (const c of children) {
    try {
      c.kill('SIGTERM');
    } catch {
      /* already gone */
    }
  }
  // Force-kill anything that ignores SIGTERM after a grace period.
  setTimeout(() => {
    for (const c of children) {
      try {
        c.kill('SIGKILL');
      } catch {
        /* already gone */
      }
    }
    process.exit(code);
  }, 3000).unref();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

async function main() {
  console.log('[serve-all] Starting the micro-frontend stack…\n');

  await startDb();

  console.log('[serve-all] Starting micro-services (build + serve)…');
  start('catalog-svc', ['serve', 'catalog-svc']);
  start('cart-svc', ['serve', 'cart-svc']);
  start('user-svc', ['serve', 'user-svc']);

  console.log(
    `[serve-all] Waiting for service ports ${PORTS.catalog}, ${PORTS.cart}, ${PORTS.user}…`,
  );
  await Promise.all([
    waitForPort(PORTS.catalog),
    waitForPort(PORTS.cart),
    waitForPort(PORTS.user),
  ]);
  console.log('[serve-all] Services are listening. Starting the gateway…');

  start('api-gateway', ['serve', 'api-gateway'], { PORT: String(PORTS.gateway) });
  start('shell', ['serve', 'shell', '--port', String(PORTS.shell)]);

  console.log('\n[serve-all] Stack is up:\n');
  console.log(`  Shell (browser):   http://localhost:${PORTS.shell}`);
  console.log(`  Gateway (GraphQL): http://localhost:${PORTS.gateway}/graphql`);
  console.log(`  Gateway (health):  http://localhost:${PORTS.gateway}/health`);
  console.log(`  catalog-svc:       http://localhost:${PORTS.catalog}/graphql`);
  console.log(`  cart-svc:          http://localhost:${PORTS.cart}/graphql`);
  console.log(`  user-svc:          http://localhost:${PORTS.user}/graphql`);
  console.log('\n[serve-all] Press Ctrl+C to stop everything.\n');
}

main().catch((err) => {
  console.error(`[serve-all] Fatal: ${err?.message ?? err}`);
  shutdown(1);
});

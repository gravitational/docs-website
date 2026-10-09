// Process lifecycle: preflight port/orphan cleanup, spawning the Docusaurus dev
// server in its own process group, and reliably tearing the whole group down.
//
// This is the piece that fixes the "orphaned node holding port 3000 -> new tab
// on 3001" failure mode of the old script, which killed only its direct shell
// children and left the node grandchild running.

import { spawn, spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { log } from "./log.mjs";

const PIDFILE = (root) => join(root, "devtools", ".dev.pid");

// PIDs currently LISTENing on a TCP port (macOS/BSD lsof).
export function pidsOnPort(port) {
  const r = spawnSync("lsof", ["-ti", `tcp:${port}`, "-sTCP:LISTEN"], {
    encoding: "utf8",
  });
  if (r.status !== 0 || !r.stdout) return [];
  return [...new Set(r.stdout.split(/\s+/).filter(Boolean).map(Number))];
}

// PIDs whose full command line matches a pattern (pgrep -f).
function pgrep(pattern) {
  const r = spawnSync("pgrep", ["-f", pattern], { encoding: "utf8" });
  if (r.status !== 0 || !r.stdout) return [];
  return r.stdout.split(/\s+/).filter(Boolean).map(Number);
}

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

function killPid(pid, label) {
  if (!pid || pid === process.pid || !alive(pid)) return false;
  try {
    process.kill(pid, "SIGTERM");
  } catch {}
  // Escalate if still alive shortly after.
  const deadline = Date.now() + 1500;
  while (alive(pid) && Date.now() < deadline) {
    spawnSync("sleep", ["0.05"]);
  }
  if (alive(pid)) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {}
  }
  if (label) log.warn(`reaped ${label} (pid ${pid})`);
  return true;
}

// Free a specific port (kills whatever is LISTENing on it).
export function freePort(port) {
  const pids = pidsOnPort(port);
  for (const pid of pids) killPid(pid, `process on :${port}`);
  return pids.length;
}

// On startup: if a previous run of THIS tool left a pidfile, kill its server
// group, then make sure the target port is free.
export function reapOwn(root, port) {
  const f = PIDFILE(root);
  if (existsSync(f)) {
    try {
      const prev = JSON.parse(readFileSync(f, "utf8"));
      if (prev.serverPid) {
        try {
          process.kill(-prev.serverPid, "SIGKILL");
        } catch {}
      }
    } catch {}
    rmSync(f, { force: true });
  }
  freePort(port);
}

// The "clean up the mess" button: aggressively kill every known docs dev process
// for THIS repo — the legacy start-dev.sh watchers, stray docusaurus servers,
// and any of our own sessions — then free the usual dev ports.
export function reapAll(root, ports = [3000, 3001, 3002, 3003]) {
  let n = 0;
  const patterns = [
    "scripts/start-dev.sh",
    "watchexec .*--watch content",
    `${root}/node_modules/.bin/docusaurus start`,
    `${root}/node_modules/.bin/docusaurus`,
    `${root}/devtools/dev.mjs`,
  ];
  const targets = new Set();
  for (const p of patterns) for (const pid of pgrep(p)) targets.add(pid);
  for (const pid of targets) if (killPid(pid, "legacy dev process")) n++;
  for (const port of ports) n += freePort(port);
  rmSync(PIDFILE(root), { force: true });
  return n;
}

// Spawn `docusaurus start` in its own process group. Returns the child.
//   devConfig — absolute path to an alternate config file (--config), used to
//               apply the dev-only memory trims (see docusaurus.dev.config.ts).
//   env       — extra env vars to layer on top of process.env (e.g. the
//               DEV_ONLY_VERSIONS / NODE_OPTIONS knobs).
export function spawnServer(root, { port, host, onReady, devConfig, env } = {}) {
  const bin = join(root, "node_modules", ".bin", "docusaurus");
  const args = ["start", "--no-open", "--port", String(port)];
  if (host) args.push("--host", host);
  if (devConfig) args.push("--config", devConfig);

  const child = spawn(bin, args, {
    cwd: root,
    detached: true, // new process group => we can kill the whole tree
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...(env || {}) },
  });

  let ready = false;
  const scan = (buf, sink) => {
    const s = buf.toString();
    sink.write(s);
    if (!ready && /(compiled|client.*compiled|running at|localhost:)/i.test(s)) {
      ready = true;
      onReady?.();
    }
  };
  child.stdout.on("data", (b) => scan(b, process.stdout));
  child.stderr.on("data", (b) => scan(b, process.stderr));

  return child;
}

export function writePidfile(root, { serverPid, port }) {
  writeFileSync(
    PIDFILE(root),
    JSON.stringify({ pid: process.pid, serverPid, port }),
  );
}

export function removePidfile(root) {
  rmSync(PIDFILE(root), { force: true });
}

// Kill the server's whole process group, escalating to SIGKILL.
export function killServer(child) {
  if (!child || child.killed || child.exitCode !== null) return;
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    try {
      child.kill("SIGTERM");
    } catch {}
  }
  setTimeout(() => {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {}
  }, 2000).unref?.();
}

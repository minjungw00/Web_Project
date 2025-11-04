#!/usr/bin/env node
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

/**
 * Merge multiple dotenv files into a temporary file and run `docker compose` with it.
 * Usage:
 *   node scripts/compose-with-env.mjs --env <file> [--env <file> ...] -- docker compose [args]
 *
 * Notes:
 * - Later --env files override earlier ones on duplicate keys.
 * - Missing files are skipped with a warning.
 */

const args = process.argv.slice(2);
const envFiles = [];
let sepIndex = args.indexOf("--");
if (sepIndex === -1) sepIndex = args.length;
for (let i = 0; i < sepIndex; i++) {
  if (args[i] === "--env" && i + 1 < sepIndex) {
    envFiles.push(args[i + 1]);
    i++;
  }
}
const composeArgs = args.slice(sepIndex + 1);

if (
  composeArgs.length === 0 ||
  composeArgs[0] !== "docker" ||
  composeArgs[1] !== "compose"
) {
  console.error(
    "[compose-with-env] Usage: node scripts/compose-with-env.mjs --env <file> [--env <file> ...] -- docker compose <args>"
  );
  process.exit(2);
}

// Read all env files in order, keeping last-wins semantics.
const kv = new Map();
const reLine = /^(\s*#.*|\s*)$/;
for (const file of envFiles) {
  try {
    const content = readFileSync(file, "utf8");
    for (const line of content.split(/\r?\n/)) {
      if (reLine.test(line)) continue; // skip comments/blank
      const idx = line.indexOf("=");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1);
      if (key) kv.set(key, val);
    }
  } catch (e) {
    console.warn(`[compose-with-env] Skip missing env file: ${file}`);
  }
}

const tmpDir = mkdtempSync(join(tmpdir(), "compose-env-"));
const mergedPath = join(tmpDir, ".env.merged");
let merged = "";
for (const [k, v] of kv.entries()) {
  merged += `${k}=${v}\n`;
}
writeFileSync(mergedPath, merged, { encoding: "utf8" });

const finalArgs = [
  "compose",
  "--env-file",
  mergedPath,
  ...composeArgs.slice(2),
];
const result = spawnSync("docker", finalArgs, { stdio: "inherit" });
process.exit(result.status ?? 0);

#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function usage() {
  console.log(`Usage:
  node scripts/detect-docker-cidr.mjs --network <docker_network_name> [--env-file <path>] [--var <ENV_VAR_NAME>]

Examples:
  node scripts/detect-docker-cidr.mjs --network web_project_webnet-dev
  node scripts/detect-docker-cidr.mjs --network web_project_webnet --env-file infra/gateway/nginx/.env.production --var NGINX_MONITORING_INTERNAL_CIDR
`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === "--help" || k === "-h") return { help: true };
    if (k === "--network" && v) {
      args.network = v;
      i++;
      continue;
    }
    if (k === "--env-file" && v) {
      args.envFile = v;
      i++;
      continue;
    }
    if (k === "--var" && v) {
      args.var = v;
      i++;
      continue;
    }
  }
  return args;
}

function detectSubnet(networkName) {
  const cmd = `docker network inspect ${networkName} --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}'`;
  try {
    const out = execSync(cmd, { stdio: ["ignore", "pipe", "inherit"] })
      .toString()
      .trim();
    if (!out) throw new Error("No subnet found.");
    return out;
  } catch (e) {
    console.error(
      `[detect-docker-cidr] Failed to inspect network: ${networkName}`
    );
    throw e;
  }
}

function updateEnvFile(envPath, varName, value) {
  const abs = resolve(envPath);
  let content = existsSync(abs) ? readFileSync(abs, "utf8") : "";
  const line = `${varName}=${value}`;
  if (content.includes(`${varName}=`)) {
    content = content.replace(new RegExp(`^${varName}=.*$`, "m"), line);
  } else {
    if (content.length && !content.endsWith("\n")) content += "\n";
    content += line + "\n";
  }
  writeFileSync(abs, content, "utf8");
  return abs;
}

(function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.network) return usage();

  const subnet = detectSubnet(args.network);
  console.log(subnet);

  if (args.envFile) {
    const varName = args.var || "NGINX_MONITORING_INTERNAL_CIDR";
    const path = updateEnvFile(args.envFile, varName, subnet);
    console.error(
      `[detect-docker-cidr] Updated ${varName} in ${path} => ${subnet}`
    );
  }
})();

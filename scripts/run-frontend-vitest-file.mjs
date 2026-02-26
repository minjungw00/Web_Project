import { spawnSync } from "node:child_process";

const forwardedArgs = process.argv.slice(2).filter((arg, index) => {
  return !(index === 0 && arg === "--");
});

const result = spawnSync(
  "pnpm",
  ["--filter", "./frontend", "exec", "vitest", "run", ...forwardedArgs],
  {
    stdio: "inherit",
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);

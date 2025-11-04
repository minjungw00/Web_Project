#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");
const appDir = resolve(projectRoot, "infra", "application");
const envFilePath = resolve(appDir, ".env.application.dev");

const toInteger = (value, defaultValue) => {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return defaultValue;
};

const determineUid = () => {
  if (process.env.LOCAL_UID) {
    return toInteger(process.env.LOCAL_UID, 1000);
  }
  if (typeof process.getuid === "function") {
    return toInteger(process.getuid(), 1000);
  }
  if (process.env.SUDO_UID) {
    return toInteger(process.env.SUDO_UID, 1000);
  }
  return 1000;
};

const determineGid = () => {
  if (process.env.LOCAL_GID) {
    return toInteger(process.env.LOCAL_GID, 1000);
  }
  if (typeof process.getgid === "function") {
    return toInteger(process.getgid(), 1000);
  }
  if (process.env.SUDO_GID) {
    return toInteger(process.env.SUDO_GID, 1000);
  }
  return 1000;
};

const updateEnvFile = (filePath, uid, gid) => {
  mkdirSync(dirname(filePath), { recursive: true });

  let content = "";

  if (existsSync(filePath)) {
    // Read existing file
    content = readFileSync(filePath, "utf8");

    // Update or add LOCAL_UID
    if (content.includes("LOCAL_UID=")) {
      content = content.replace(/LOCAL_UID=\d+/g, `LOCAL_UID=${uid}`);
    } else {
      content += `\nLOCAL_UID=${uid}`;
    }

    // Update or add LOCAL_GID
    if (content.includes("LOCAL_GID=")) {
      content = content.replace(/LOCAL_GID=\d+/g, `LOCAL_GID=${gid}`);
    } else {
      content += `\nLOCAL_GID=${gid}`;
    }

    // Clean up multiple newlines
    content = content.replace(/\n{3,}/g, "\n\n");
  } else {
    // Create new file with template
    content = `# Docker Compose settings for Application (Development)
# This file is auto-generated and git-ignored

# User ID mappings (auto-updated by sync-local-ids.mjs)
LOCAL_UID=${uid}
LOCAL_GID=${gid}

# Docker Compose settings
COMPOSE_PROJECT_NAME=web_project-dev-application
COMPOSE_NETWORK=web_project-dev-webnet

# Network settings
EXTERNAL_NETWORK=web_project-dev-webnet

# MySQL connection (references infrastructure layer)
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_DATABASE=appdb
MYSQL_USER=app
MYSQL_PASSWORD=apppassword

# Volume mounts
FE_DIST_MOUNT=web_project-dev-frontend-dist
CERTBOT_MOUNT=web_project-dev-certbot-dev

# Image settings (for production reference)
FRONTEND_IMAGE=ghcr.io/minjungw00/web-project-frontend
BACKEND_IMAGE=ghcr.io/minjungw00/web-project-backend
FE_TAG=latest
BE_TAG=latest
`;
  }

  writeFileSync(filePath, content, { encoding: "utf8" });
};

const uid = determineUid();
const gid = determineGid();

updateEnvFile(envFilePath, uid, gid);

console.info(`Updated LOCAL_UID=${uid}, LOCAL_GID=${gid} in ${envFilePath}`);

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const skipDirs = new Set([".git", "node_modules", "dist", "coverage", ".next", ".cache"]);
const skipExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico"]);
const maxFileSize = 1024 * 1024;

const patterns = [
  ["github_pat", /github_pat_[A-Za-z0-9_]{30,}/g],
  ["github_token", /gh[pousr]_[A-Za-z0-9_]{30,}/g],
  ["openai_key", /sk-[A-Za-z0-9_-]{20,}/g],
  ["aws_access_key", /AKIA[0-9A-Z]{16}/g],
  ["jwt", /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g],
  ["private_key_header", /-----BEGIN [A-Z ]*PRIVATE KEY-----/g],
  ["secret_assignment", /\b(?:api[_-]?key|apikey|secret|password|passwd|bearer|authorization|private[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token)\b\s*[:=]\s*["']?[^"'\s]{12,}/gi],
  ["long_random_literal", /(?<![A-Za-z0-9+/=_-])(?:[A-Fa-f0-9]{48,}|[A-Za-z0-9+/]{64,}={0,2})(?![A-Za-z0-9+/=_-])/g]
];

const artifactPatterns = patterns.filter(([name]) =>
  ["github_pat", "github_token", "openai_key", "aws_access_key", "jwt", "private_key_header"].includes(name)
);

const allowList = [
  /^AGENTS\.md$/,
  /^README\.md$/,
  /^package-lock\.json$/,
  /^apps-in-toss\/package-lock\.json$/
];

const findings = [];

function shouldSkipDirectory(rel, name) {
  return skipDirs.has(name) ||
    rel === "apps-in-toss/node_modules" ||
    rel === "apps-in-toss/dist";
}

function shouldSkipFile(rel) {
  if (allowList.some((re) => re.test(rel))) return true;
  const ext = path.extname(rel).toLowerCase();
  return skipExtensions.has(ext);
}

function redact(value) {
  if (value.length <= 12) return "[redacted]";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function scanText(text, rel, activePatterns = patterns) {
  const lines = text.split(/\r?\n/);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    for (const [name, pattern] of activePatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        findings.push({
          file: rel,
          line: lineIndex + 1,
          type: name,
          sample: redact(match[0])
        });
      }
    }
  }
}

function scanFile(filePath, rel) {
  if (shouldSkipFile(rel)) return;
  const stat = fs.statSync(filePath);
  if (stat.size > maxFileSize) return;
  let text;
  try {
    text = fs.readFileSync(filePath, "utf8");
  } catch {
    return;
  }
  if (text.includes("\0")) return;
  scanText(text, rel);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full);
    if (entry.isDirectory()) {
      if (!shouldSkipDirectory(rel, entry.name)) {
        walk(full);
      }
      continue;
    }
    scanFile(full, rel);
  }
}

function scanAitArtifact(artifactPath) {
  if (!fs.existsSync(artifactPath)) return;
  const list = spawnSync("unzip", ["-Z1", artifactPath], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  const entries = (list.stdout || "").split("\n").filter((entry) => /\.(js|map|html|css)$/.test(entry));
  for (const entry of entries) {
    const unzipped = spawnSync("unzip", ["-p", artifactPath, entry], { encoding: "utf8", maxBuffer: 25 * 1024 * 1024 });
    if (!unzipped.stdout) continue;
    scanText(unzipped.stdout, `${artifactPath}:${entry}`, artifactPatterns);
  }
}

walk(root);
scanAitArtifact(path.join("apps-in-toss", "baby-gift-tax-helper.ait"));

if (findings.length > 0) {
  console.error(JSON.stringify(findings.slice(0, 100), null, 2));
  console.error(`Secret scan failed with ${findings.length} finding(s). Values are redacted.`);
  process.exit(1);
}

console.log("Secret scan passed: no obvious committed or local secret patterns found.");

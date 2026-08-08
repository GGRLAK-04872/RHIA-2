import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const distDirectory = path.join(root, "apps", "web", "dist");
const requiredFiles = ["index.html", "manifest.webmanifest", "rhia-icon.svg", "sw.js"];
const forbiddenExtensions = new Set([".map", ".md", ".ts", ".tsx"]);
const forbiddenNames = new Set([".env", ".env.local"]);
const forbiddenContent = [
  "OPENAI_API_KEY",
  "RHIA_OWNER_TOKEN",
  "api.openai.com",
  "rhia.pages.dev",
  "wrangler",
  "durableobject",
  "x-rhia-owner-token",
  "/api/chat",
  "/api/knowledge",
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

for (const requiredFile of requiredFiles) {
  await access(path.join(distDirectory, requiredFile));
}

const findings = [];

for (const file of await collectFiles(distDirectory)) {
  const relativePath = path.relative(distDirectory, file);
  const extension = path.extname(file);

  if (forbiddenExtensions.has(extension) || forbiddenNames.has(path.basename(file))) {
    findings.push(`${relativePath}: interner Dateityp`);
    continue;
  }

  const content = await readFile(file);
  if (content.includes(0)) {
    continue;
  }

  const text = content.toString("utf8").toLowerCase();
  for (const forbidden of forbiddenContent) {
    if (text.includes(forbidden.toLowerCase())) {
      findings.push(`${relativePath}: verbotener Inhalt ${forbidden}`);
    }
  }
}

if (findings.length > 0) {
  console.error("Öffentlicher Build enthält nicht freigegebene Inhalte:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log("Build-Audit bestanden: App-Shell vollständig, keine internen Dateien oder Alt-APIs.");

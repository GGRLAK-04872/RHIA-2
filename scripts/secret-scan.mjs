import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  ".vite",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
  "upload",
]);
const ignoredFiles = new Set(["pnpm-lock.yaml", "secret-scan.mjs"]);

const patterns = [
  {
    label: "OpenAI API key",
    expression: new RegExp(`s${"k"}-(?:proj|svcacct)-[A-Za-z0-9_-]{20,}`, "g"),
  },
  {
    label: "GitHub token",
    expression: new RegExp(`g${"h"}[pousr]_[A-Za-z0-9]{30,}`, "g"),
  },
  {
    label: "AWS access key",
    expression: new RegExp(`A${"K"}IA[0-9A-Z]{16}`, "g"),
  },
  {
    label: "private key",
    expression: new RegExp(`-----BEGIN [A-Z ]*PRIVATE K${"E"}Y-----`, "g"),
  },
  {
    label: "assigned secret",
    expression: new RegExp(
      `(?:OPENAI_API_K${"E"}Y|RHIA_OWNER_TOK${"E"}N|GITHUB_TOK${"E"}N)\\s*=\\s*["']?[^"'\\s#]{8,}`,
      "g",
    ),
  },
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)));
    } else if (entry.isFile() && !ignoredFiles.has(entry.name)) {
      files.push(absolutePath);
    }
  }

  return files;
}

const findings = [];

for (const file of await collectFiles(root)) {
  const content = await readFile(file);

  if (content.includes(0)) {
    continue;
  }

  const text = content.toString("utf8");
  for (const pattern of patterns) {
    pattern.expression.lastIndex = 0;
    if (pattern.expression.test(text)) {
      findings.push({
        file: path.relative(root, file),
        label: pattern.label,
      });
    }
  }
}

if (findings.length > 0) {
  console.error("Secret-Scan fehlgeschlagen. Betroffene Dateien und Muster:");
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.label}`);
  }
  process.exit(1);
}

console.log("Secret-Scan bestanden: keine Schlüssel- oder Tokenmuster gefunden.");

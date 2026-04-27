import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const ignoredDirectories = new Set([".git", ".github", "_site", "node_modules", "src"]);
const ignoredFiles = new Set(["google5b8cadcfa34c4ae7.html"]);

function normalizeUrl(relativePath) {
  if (relativePath === "index.html") {
    return "/";
  }

  if (relativePath.endsWith("/index.html")) {
    return `/${relativePath.slice(0, -"index.html".length)}`;
  }

  return `/${relativePath}`;
}

function collectHtmlFiles(currentDir, results) {
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || ignoredDirectories.has(entry.name)) {
      continue;
    }

    const absolutePath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      collectHtmlFiles(absolutePath, results);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".html") || ignoredFiles.has(entry.name)) {
      continue;
    }

    const relativePath = path.relative(rootDir, absolutePath).split(path.sep).join("/");
    results.add(normalizeUrl(relativePath));
  }
}

export default function sitemapData() {
  const urls = new Set(["/", "/index_en.html"]);
  collectHtmlFiles(rootDir, urls);

  return {
    baseUrl: "https://45deg.github.io",
    urls: [...urls].sort((left, right) => left.localeCompare(right))
  };
}
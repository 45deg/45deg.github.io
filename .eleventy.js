import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const passthroughExcludes = new Set([
  ".git",
  ".github",
  ".gitignore",
  ".DS_Store",
  ".eleventy.js",
  "_site",
  "node_modules",
  "index.html",
  "package.json",
  "package-lock.json",
  "src"
]);

function localPath(value) {
  return value;
}

function absoluteUrl(value, baseUrl) {
  return new URL(value, baseUrl).href;
}

function isLocalWorkHref(href) {
  return typeof href === "string" && !/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(href);
}

function normalizeLocalWorkHref(href) {
  return href.replace(/^\.\//, "").replace(/^\//, "");
}

function getWorkOutputHtmlPath(work) {
  if (!isLocalWorkHref(work.href)) return null;

  const normalizedHref = normalizeLocalWorkHref(work.href);
  if (!normalizedHref) return null;

  const relativeHtmlPath = normalizedHref.endsWith(".html")
    ? normalizedHref
    : path.join(normalizedHref, "index.html");

  return path.join("_site", relativeHtmlPath);
}

function getHomeButtonPosition(work) {
  const position = work.homeButton?.position;
  return position === "bottom-left" ? "bottom-left" : "bottom-right";
}

function shouldInjectHomeButton(work) {
  return work.homeButton !== false;
}

function homeButtonSnippet(position) {
  return `<script src="/button-inject.js" data-position="${position}"></script>`;
}

function injectHomeButton(html, position) {
  if (html.includes("button-inject.js")) return html;

  const snippet = homeButtonSnippet(position);
  const bodyCloseIndex = html.lastIndexOf("</body>");
  if (bodyCloseIndex !== -1) {
    return `${html.slice(0, bodyCloseIndex)}${snippet}\n${html.slice(bodyCloseIndex)}`;
  }

  return `${html}\n${snippet}\n`;
}

function injectHomeButtons(homepage) {
  for (const work of homepage.works) {
    if (!shouldInjectHomeButton(work)) continue;

    const htmlPath = getWorkOutputHtmlPath(work);
    if (!htmlPath) continue;
    if (!fs.existsSync(htmlPath)) continue;

    const html = fs.readFileSync(htmlPath, "utf8");
    fs.writeFileSync(htmlPath, injectHomeButton(html, getHomeButtonPosition(work)));
  }
}

export default function(eleventyConfig) {
  const homepage = yaml.load(fs.readFileSync("src/_data/homepage.yml", "utf8"));

  eleventyConfig.addGlobalData(
    "homepage",
    homepage
  );

  eleventyConfig.addPassthroughCopy({ "src/button-inject.js": "button-inject.js" });

  for (const entry of fs.readdirSync(".")) {
    if (!passthroughExcludes.has(entry)) {
      eleventyConfig.addPassthroughCopy({ [entry]: entry });
    }
  }

  eleventyConfig.addFilter("locale", (value, lang) => {
    if (value && typeof value === "object" && lang in value) return value[lang];
    return value;
  });

  eleventyConfig.addFilter("localPath", localPath);
  eleventyConfig.addFilter("absoluteUrl", absoluteUrl);
  eleventyConfig.addFilter("json", (value) => JSON.stringify(value));

  eleventyConfig.addFilter("countByFilter", (works, key) => {
    if (key === "all") return works.length;
    if (key === "featured") return works.filter((work) => work.featured).length;
    return works.filter((work) => work.tags?.includes(key[0].toUpperCase() + key.slice(1))).length;
  });

  eleventyConfig.on("eleventy.after", () => {
    injectHomeButtons(homepage);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
}

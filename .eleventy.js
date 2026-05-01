import fs from "node:fs";
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

export default function(eleventyConfig) {
  eleventyConfig.addGlobalData(
    "homepage",
    yaml.load(fs.readFileSync("src/_data/homepage.yml", "utf8"))
  );

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
    return works.filter((work) => work.categories?.includes(key)).length;
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

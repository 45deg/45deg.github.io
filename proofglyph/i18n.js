"use strict";
(() => {
  const translations = typeof module !== "undefined"
    ? require("./translations.source.js") : globalThis.proofglyphTranslations;

  function negotiate(languages = [], language = "") {
    for (const candidate of [...languages, language]) {
      if (typeof candidate !== "string") continue;
      const base = candidate.toLowerCase().split(/[-_]/)[0];
      if (base === "en" || base === "ja") return base;
    }
    return "en";
  }
  function create(languages, language) {
    let locale = negotiate(languages, language);
    function t(key, values = {}) {
      const entry = translations.messages[key];
      if (!entry) throw new Error(`Unknown translation: ${key}`);
      return (entry[locale] ?? entry.en).replace(/\{(\w+)\}/g,
        (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
    }
    function setText(node, key, values = {}) {
      node.dataset.i18nMessage = key;
      node.dataset.i18nValues = JSON.stringify(values);
      // Do not let initial static copy overwrite runtime state on languagechange.
      delete node.dataset.i18n;
      node.textContent = t(key, values);
    }
    function apply(root) {
      root.documentElement.lang = locale;
      for (const node of root.querySelectorAll("[data-i18n]")) {
        const entry = translations.html[node.dataset.i18n];
        // Only repository-authored markup is used here, never compiler/user input.
        node.innerHTML = entry[locale] ?? entry.en;
      }
      for (const attr of ["aria-label", "title", "placeholder", "alt"]) {
        for (const node of root.querySelectorAll(`[data-i18n-${attr}]`)) {
          const entry = translations.html[node.getAttribute(`data-i18n-${attr}`)];
          node.setAttribute(attr, entry[locale] ?? entry.en);
        }
      }
      for (const node of root.querySelectorAll("[data-i18n-message]")) {
        node.textContent = t(node.dataset.i18nMessage, JSON.parse(node.dataset.i18nValues || "{}"));
      }
    }
    return {
      get locale() { return locale; }, t, setText, apply,
      number: value => value.toLocaleString(locale === "ja" ? "ja-JP" : "en-US"),
      catalog: key => translations.catalog[key]?.[locale] ?? key,
      update(languages, language) { locale = negotiate(languages, language); }
    };
  }
  if (typeof module !== "undefined") {
    module.exports = {negotiate, create};
  } else {
    const i18n = create(navigator.languages, navigator.language);
    globalThis.proofglyphI18n = i18n;
    i18n.apply(document);
    window.addEventListener("languagechange", () => {
      i18n.update(navigator.languages, navigator.language);
      i18n.apply(document);
      window.dispatchEvent(new Event("proofglyph:languagechange"));
    });
  }
})();

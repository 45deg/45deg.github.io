(() => {
  if (document.querySelector("[data-45deg-home-button-host]")) return;

  const scriptEl = document.currentScript;
  const position =
    scriptEl?.dataset.position === "bottom-left" ? "bottom-left" : "bottom-right";

  const host = document.createElement("div");
  host.setAttribute("data-45deg-home-button-host", "");
  host.setAttribute("data-position", position);
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host {
        position: fixed;
        right: max(16px, env(safe-area-inset-right));
        bottom: max(16px, env(safe-area-inset-bottom));
        z-index: 2147483647;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      :host([data-position="bottom-left"]) {
        right: auto;
        left: max(16px, env(safe-area-inset-left));
      }

      .home-button {
        position: relative;
        display: inline-flex;
      }

      a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border: 2px solid transparent;
        border-radius: 10px;
        background:
          linear-gradient(rgb(255 255 255 / 0.92), rgb(255 255 255 / 0.88)) padding-box,
          linear-gradient(135deg, rgb(59 130 246 / 0.72), rgb(236 72 153 / 0.56), rgb(245 158 11 / 0.58)) border-box;
        color: rgb(17 24 39);
        box-shadow:
          0 12px 28px rgb(0 0 0 / 0.24),
          0 0 0 1px rgb(255 255 255 / 0.2),
          inset 0 1px 0 rgb(255 255 255 / 0.72);
        text-decoration: none;
        backdrop-filter: blur(12px) saturate(1.2);
        -webkit-backdrop-filter: blur(12px) saturate(1.2);
        transition: transform 160ms ease, background 160ms ease, box-shadow 160ms ease;
        -webkit-tap-highlight-color: transparent;
      }

      a:hover {
        background:
          linear-gradient(rgb(255 255 255 / 0.98), rgb(255 255 255 / 0.94)) padding-box,
          linear-gradient(135deg, rgb(37 99 235 / 0.9), rgb(219 39 119 / 0.74), rgb(217 119 6 / 0.74)) border-box;
        box-shadow:
          0 16px 34px rgb(0 0 0 / 0.3),
          0 0 0 1px rgb(255 255 255 / 0.28),
          inset 0 1px 0 rgb(255 255 255 / 0.84);
        transform: translateY(-1px);
      }

      a:focus-visible {
        outline: 3px solid rgb(99 179 237 / 0.9);
        outline-offset: 3px;
      }

      .tooltip {
        position: absolute;
        top: 50%;
        right: calc(100% + 10px);
        max-width: min(220px, calc(100vw - 88px));
        padding: 8px 10px;
        border: 1px solid rgb(17 24 39 / 0.16);
        border-radius: 8px;
        background: rgb(255 255 255 / 0.94);
        color: rgb(17 24 39);
        box-shadow:
          0 10px 24px rgb(0 0 0 / 0.2),
          inset 0 1px 0 rgb(255 255 255 / 0.7);
        font-size: 12px;
        font-weight: 600;
        line-height: 1.35;
        opacity: 0;
        pointer-events: none;
        text-align: center;
        transform: translate(4px, -50%);
        transition: opacity 140ms ease, transform 140ms ease;
        white-space: nowrap;
      }

      :host([data-position="bottom-left"]) .tooltip {
        right: auto;
        left: calc(100% + 10px);
        transform: translate(-4px, -50%);
      }

      .home-button:hover .tooltip,
      .home-button:focus-within .tooltip {
        opacity: 1;
        transform: translate(0, -50%);
      }

      svg {
        width: 24px;
        height: 24px;
        stroke-width: 2.2;
      }

      @media (max-width: 520px) {
        a {
          width: 44px;
          height: 44px;
          border-radius: 9px;
        }

        .tooltip {
          right: 0;
          top: auto;
          bottom: calc(100% + 8px);
          transform: translateY(4px);
        }

        :host([data-position="bottom-left"]) .tooltip {
          left: 0;
          right: auto;
          transform: translateY(4px);
        }

        .home-button:hover .tooltip,
        .home-button:focus-within .tooltip {
          transform: translateY(0);
        }
      }

      @media (prefers-color-scheme: dark) {
        a {
          background:
            linear-gradient(rgb(17 24 39 / 0.9), rgb(17 24 39 / 0.86)) padding-box,
            linear-gradient(135deg, rgb(96 165 250 / 0.76), rgb(244 114 182 / 0.58), rgb(251 191 36 / 0.58)) border-box;
          color: rgb(249 250 251);
          box-shadow:
            0 12px 28px rgb(0 0 0 / 0.44),
            0 0 0 1px rgb(255 255 255 / 0.08),
            inset 0 1px 0 rgb(255 255 255 / 0.18);
        }

        a:hover {
          background:
            linear-gradient(rgb(31 41 55 / 0.96), rgb(31 41 55 / 0.92)) padding-box,
            linear-gradient(135deg, rgb(147 197 253 / 0.86), rgb(249 168 212 / 0.68), rgb(253 224 71 / 0.68)) border-box;
          box-shadow:
            0 16px 34px rgb(0 0 0 / 0.52),
            0 0 0 1px rgb(255 255 255 / 0.1),
            inset 0 1px 0 rgb(255 255 255 / 0.22);
        }

        .tooltip {
          border-color: rgb(255 255 255 / 0.2);
          background: rgb(17 24 39 / 0.94);
          color: rgb(249 250 251);
          box-shadow:
            0 10px 24px rgb(0 0 0 / 0.42),
            inset 0 1px 0 rgb(255 255 255 / 0.16);
        }
      }
    </style>
    <span class="home-button">
      <span class="tooltip" id="home-button-tooltip" role="tooltip">Back To Top</span>
      <a href="/" aria-label="Back To Top" aria-describedby="home-button-tooltip">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m3 11 9-8 9 8"></path>
          <path d="M5 10v10h14V10"></path>
          <path d="M9 20v-6h6v6"></path>
        </svg>
      </a>
    </span>
  `;
  const label = navigator.language?.toLowerCase().startsWith("ja") ? "トップに戻る" : "Back To Top";
  shadow.getElementById("home-button-tooltip").textContent = label;
  shadow.querySelector("a").setAttribute("aria-label", label);
  document.body.append(host);
})();

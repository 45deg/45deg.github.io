(() => {
  "use strict";

  // Morf intentionally supports only the languages bundled with the app.
  const Morf = window.Morf ||= {};
  const messages = {
    ja: {
      "tagline": "補正したい範囲をポイントで囲むと、傾きやゆがみを整えて正面向きの画像にします。",
      "openImage": "画像を開く",
      "workspace.label": "射影変換ワークスペース",
      "view.label": "表示するキャンバス",
      "view.input": "入力",
      "view.output": "出力",
      "view.both": "両方",
      "instruction.drag": "点をドラッグして範囲を合わせます",
      "instruction.follow": "青い角を動かすと周囲も追従します",
      "points.4": "4点",
      "points.count": "{count}点",
      "focus.expand": "拡大編集",
      "focus.done": "完了",
      "canvas.inputLabel": "変換元画像。コントロールポイントをドラッグして範囲と歪みを指定できます",
      "canvas.drop": "画像をここにドロップ",
      "canvas.help": "ポイントをタップして選択できます。選択後は矢印キーでも移動できます。",
      "canvas.outputLabel": "射影変換後の画像",
      "export.png": "PNGで保存",
      "export.error": "PNGを保存できませんでした。もう一度お試しください。",
      "rendering": "処理中…",
      "renderError": "変換に失敗しました",
      "controls.label": "変換オプション",
      "aspect.label": "アスペクト比",
      "aspect.auto": "自動（選択範囲から推定）",
      "aspect.custom": "カスタム",
      "aspect.ratio": "幅 : 高さ",
      "aspect.width": "比率の幅",
      "aspect.height": "比率の高さ",
      "sampling.label": "サンプリング",
      "mesh.label": "コントロールポイント",
      "mesh.4": "4点（2 × 2）",
      "mesh.9": "9点（3 × 3）",
      "mesh.16": "16点（4 × 4）",
      "mesh.25": "25点（5 × 5）",
      "edge.label": "エッジスナップ",
      "edge.none": "なし",
      "edge.low": "低",
      "edge.medium": "中",
      "edge.high": "高",
      "undo": "元に戻す",
      "rotate": "点を回転",
      "reset": "リセット",
      "privacy": "画像はブラウザ内だけで処理され、外部へ送信されません。",
      "demo.prompt": "コントロールポイントを動かしてみましょう"
    },
    en: {
      "tagline": "Outline the area you want to correct, and Morf straightens its perspective and distortion.",
      "openImage": "Open image",
      "workspace.label": "Perspective correction workspace",
      "view.label": "Canvas view",
      "view.input": "Input",
      "view.output": "Output",
      "view.both": "Both",
      "instruction.drag": "Drag the points to outline the area",
      "instruction.follow": "Move a blue corner to adjust the surrounding points",
      "points.4": "4 points",
      "points.count": "{count} points",
      "focus.expand": "Expand editor",
      "focus.done": "Done",
      "canvas.inputLabel": "Source image. Drag the control points to define the area and distortion.",
      "canvas.drop": "Drop an image here",
      "canvas.help": "Tap a point to select it. You can then move it with the arrow keys.",
      "canvas.outputLabel": "Perspective-corrected image",
      "export.png": "Save PNG",
      "export.error": "The PNG could not be saved. Please try again.",
      "rendering": "Processing…",
      "renderError": "Transformation failed",
      "controls.label": "Transformation options",
      "aspect.label": "Aspect ratio",
      "aspect.auto": "Auto (estimate from selection)",
      "aspect.custom": "Custom",
      "aspect.ratio": "Width : Height",
      "aspect.width": "Aspect ratio width",
      "aspect.height": "Aspect ratio height",
      "sampling.label": "Sampling",
      "mesh.label": "Control points",
      "mesh.4": "4 points (2 × 2)",
      "mesh.9": "9 points (3 × 3)",
      "mesh.16": "16 points (4 × 4)",
      "mesh.25": "25 points (5 × 5)",
      "edge.label": "Edge snap",
      "edge.none": "Off",
      "edge.low": "Low",
      "edge.medium": "Medium",
      "edge.high": "High",
      "undo": "Undo",
      "rotate": "Rotate points",
      "reset": "Reset",
      "privacy": "Your image is processed entirely in this browser and is never uploaded.",
      "demo.prompt": "Try moving the control points"
    }
  };

  const language = (navigator.language || "en").toLowerCase();
  const locale = language === "ja" || language.startsWith("ja-") ? "ja" : "en";

  function t(key, variables = {}) {
    const template = messages[locale][key] ?? messages.en[key] ?? key;
    return template.replace(/\{(\w+)\}/g, (_, name) => variables[name] ?? `{${name}}`);
  }

  function apply(root = document) {
    document.documentElement.lang = locale;
    root.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    root.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
    });
  }

  Morf.I18n = { apply, locale, t };
})();

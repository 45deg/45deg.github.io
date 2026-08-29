const cryptoApi = globalThis.crypto;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const state = { publicArmor: "", privateArmor: "" };
const qrTypeCodes = { "PUBLIC KEY": 1, MESSAGE: 2, SIGNATURE: 3 };
let qrCodePromise;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function bytesToBase64(bytes) {
  let binary = "";
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i += 0x8000) {
    binary += String.fromCharCode(...view.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function armor(label, payload) {
  const body = bytesToBase64(encoder.encode(JSON.stringify(payload)));
  const lines = body.match(/.{1,64}/g)?.join("\n") ?? "";
  return `-----BEGIN WEBCRYPTO ${label}-----\n${lines}\n-----END WEBCRYPTO ${label}-----`;
}

function unarmor(label, value) {
  const start = `-----BEGIN WEBCRYPTO ${label}-----`;
  const end = `-----END WEBCRYPTO ${label}-----`;
  const trimmed = value.trim();
  if (!trimmed.startsWith(start) || !trimmed.endsWith(end)) throw new Error(`${label} の形式が正しくありません。`);
  const data = trimmed.slice(start.length, -end.length).replace(/\s/g, "");
  return JSON.parse(decoder.decode(base64ToBytes(data)));
}

async function fingerprint(publicJwk) {
  const canonical = JSON.stringify({ e: publicJwk.e, kty: publicJwk.kty, n: publicJwk.n });
  const digest = new Uint8Array(await cryptoApi.subtle.digest("SHA-256", encoder.encode(canonical)));
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function formatFingerprint(value) {
  return value.match(/.{1,4}/g).join(" ");
}

async function deriveWrappingKey(passphrase, salt, usage) {
  const baseKey = await cryptoApi.subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return cryptoApi.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 310000 },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    usage,
  );
}

async function protectPrivateKeys(payload, passphrase) {
  const salt = cryptoApi.getRandomValues(new Uint8Array(16));
  const iv = cryptoApi.getRandomValues(new Uint8Array(12));
  const key = await deriveWrappingKey(passphrase, salt, ["encrypt"]);
  const ciphertext = await cryptoApi.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(JSON.stringify(payload)));
  return { version: 1, kdf: "PBKDF2-SHA256", iterations: 310000, salt: bytesToBase64(salt), iv: bytesToBase64(iv), ciphertext: bytesToBase64(ciphertext) };
}

async function revealPrivateKeys(privateArmor, passphrase) {
  const bundle = privateBundle(privateArmor);
  const key = await deriveWrappingKey(passphrase, base64ToBytes(bundle.salt), ["decrypt"]);
  try {
    const plaintext = await cryptoApi.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(bundle.iv) }, key, base64ToBytes(bundle.ciphertext));
    return JSON.parse(decoder.decode(plaintext));
  } catch {
    throw new Error("パスフレーズが違うか、秘密鍵が壊れています。");
  }
}

function publicBundle(publicArmor) {
  const bundle = unarmor("PUBLIC KEY", publicArmor);
  if (!bundle.encryptionKey || !bundle.signingKey) throw new Error("公開鍵に必要な情報がありません。");
  return bundle;
}

function privateBundle(privateArmor) {
  const bundle = unarmor("PRIVATE KEY", privateArmor);
  if (!bundle.salt || !bundle.iv || !bundle.ciphertext) throw new Error("秘密鍵に必要な情報がありません。");
  return bundle;
}

function getQrCodeLibrary() {
  qrCodePromise ??= import("https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm")
    .then((module) => module.default || module);
  return qrCodePromise;
}

async function createQrPayload(label, armoredValue) {
  const payload = encoder.encode(JSON.stringify(unarmor(label, armoredValue)));
  const checksum = new Uint8Array(await cryptoApi.subtle.digest("SHA-256", payload)).subarray(0, 8);
  const bytes = new Uint8ClampedArray(10 + payload.length + checksum.length);
  bytes.set([0x43, 0x4c, 0x46, 0x31, 1, qrTypeCodes[label]]);
  new DataView(bytes.buffer).setUint32(6, payload.length, false);
  bytes.set(payload, 10);
  bytes.set(checksum, 10 + payload.length);
  return bytes;
}

async function showQrCode(button) {
  const value = $(button.dataset.qr).value;
  if (!value) throw new Error("QRにする内容がありません。");

  const [QRCode, bytes] = await Promise.all([
    getQrCodeLibrary(),
    createQrPayload(button.dataset.qrType, value),
  ]);
  const segments = [{ data: bytes, mode: "byte" }];
  const options = { errorCorrectionLevel: "L", margin: 4, scale: 4 };

  let symbol;
  try {
    symbol = QRCode.create(segments, options);
  } catch {
    throw new Error("Version 40に収まらないため、QRコードを出力できません。");
  }
  if (symbol.version > 40) throw new Error("Version 40に収まらないため、QRコードを出力できません。");

  await QRCode.toCanvas($("#qr-canvas"), segments, options);
  $("#qr-title").textContent = `${button.dataset.qrTitle}のQRコード`;
  $("#qr-meta").textContent = `Version ${symbol.version} · ${bytes.length.toLocaleString()} bytes · 誤り訂正 L`;
  $("#qr-dialog").showModal();
}

function toast(message, error = false) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.toggle("error", error);
  element.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("show"), 3000);
}

async function withBusy(button, task) {
  const originalNodes = [...button.childNodes].map((node) => node.cloneNode(true));
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  try { return await task(); }
  catch (error) { toast(error.message || "処理に失敗しました。", true); }
  finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.replaceChildren(...originalNodes);
  }
}

function selectTab(name, focus = false) {
  $$('[role="tab"]').forEach((tab) => {
    const selected = tab.dataset.tab === name;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    tab.classList.toggle("outline", !selected);
    if (selected && focus) tab.focus();
  });
  $$('[role="tabpanel"]').forEach((panel) => { panel.hidden = panel.id !== name; });
  history.replaceState(null, "", `#${name}`);
}

const tabs = $$('[role="tab"]');
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTab(tab.dataset.tab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const next = tabs[(index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    selectTab(next.dataset.tab, true);
  });
});

selectTab(["keys", "encrypt", "decrypt", "sign"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "keys");

$("#encrypt-message").addEventListener("input", (event) => {
  $("#message-count").textContent = `${encoder.encode(event.target.value).byteLength.toLocaleString()} bytes`;
});

$("#generate-button").addEventListener("click", async () => {
  const button = $("#generate-button");
  await withBusy(button, async () => {
    const name = $("#key-name").value.trim();
    const email = $("#key-email").value.trim();
    const passphrase = $("#key-passphrase").value;
    if (!name) throw new Error("表示名を入力してください。");
    if (passphrase !== $("#key-passphrase-confirm").value) throw new Error("パスフレーズが一致しません。");

    $("#key-progress").hidden = false;
    $("#key-result").hidden = true;
    try {
      const encryptionPair = await cryptoApi.subtle.generateKey(
        { name: "RSA-OAEP", modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
        true,
        ["encrypt", "decrypt"],
      );
      const signingPair = await cryptoApi.subtle.generateKey(
        { name: "RSA-PSS", modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
        true,
        ["sign", "verify"],
      );
      const [encPublic, encPrivate, signPublic, signPrivate] = await Promise.all([
        cryptoApi.subtle.exportKey("jwk", encryptionPair.publicKey),
        cryptoApi.subtle.exportKey("jwk", encryptionPair.privateKey),
        cryptoApi.subtle.exportKey("jwk", signingPair.publicKey),
        cryptoApi.subtle.exportKey("jwk", signingPair.privateKey),
      ]);
      const id = await fingerprint(encPublic);
      const identity = { name, email, createdAt: new Date().toISOString(), fingerprint: id };
      state.publicArmor = armor("PUBLIC KEY", { version: 1, identity, encryptionKey: encPublic, signingKey: signPublic });
      state.privateArmor = armor("PRIVATE KEY", await protectPrivateKeys({ version: 1, identity, encryptionKey: encPrivate, signingKey: signPrivate }, passphrase));
      $("#public-key-output").value = state.publicArmor;
      $("#private-key-output").value = state.privateArmor;
      $("#key-identity").textContent = email ? `${name} <${email}>` : name;
      $("#key-fingerprint").textContent = formatFingerprint(id);
      $("#key-result").hidden = false;
      toast("鍵ペアを作成しました。必ず秘密鍵を保存してください。");
    } finally {
      $("#key-progress").hidden = true;
    }
  });
});

$("#import-key-button").addEventListener("click", async () => {
  const button = $("#import-key-button");
  await withBusy(button, async () => {
    const files = [...$("#key-import-file").files];
    if (!files.length) throw new Error("インポートする鍵ファイルを選択してください。");

    const imported = [];
    for (const file of files) {
      const value = (await file.text()).trim();
      if (value.startsWith("-----BEGIN WEBCRYPTO PUBLIC KEY-----")) {
        const bundle = publicBundle(value);
        state.publicArmor = value;
        $("#public-key-output").value = value;
        $("#key-identity").textContent = bundle.identity?.email
          ? `${bundle.identity.name} <${bundle.identity.email}>`
          : bundle.identity?.name || "インポートした公開鍵";
        $("#key-fingerprint").textContent = bundle.identity?.fingerprint
          ? formatFingerprint(bundle.identity.fingerprint)
          : "";
        imported.push("公開鍵");
      } else if (value.startsWith("-----BEGIN WEBCRYPTO PRIVATE KEY-----")) {
        privateBundle(value);
        state.privateArmor = value;
        $("#private-key-output").value = value;
        imported.push("秘密鍵");
      } else {
        throw new Error(`${file.name} は対応する鍵ファイルではありません。`);
      }
    }

    $("#key-result").hidden = false;
    $("#import-status").textContent = `${imported.join("と")}を読み込みました。`;
    toast(`${imported.join("と")}をインポートしました。`);
  });
});

$("#encrypt-button").addEventListener("click", async () => {
  const button = $("#encrypt-button");
  await withBusy(button, async () => {
    const message = $("#encrypt-message").value;
    if (!message) throw new Error("暗号化するメッセージを入力してください。");
    const bundle = publicBundle($("#encrypt-public-key").value);
    const publicKey = await cryptoApi.subtle.importKey("jwk", bundle.encryptionKey, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);
    const contentKey = await cryptoApi.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
    const iv = cryptoApi.getRandomValues(new Uint8Array(12));
    const [ciphertext, rawKey] = await Promise.all([
      cryptoApi.subtle.encrypt({ name: "AES-GCM", iv }, contentKey, encoder.encode(message)),
      cryptoApi.subtle.exportKey("raw", contentKey),
    ]);
    const encryptedKey = await cryptoApi.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, rawKey);
    $("#encrypted-output").value = armor("MESSAGE", {
      version: 1, recipient: bundle.identity?.fingerprint, cipher: "AES-256-GCM", keyAlgorithm: "RSA-OAEP-3072",
      iv: bytesToBase64(iv), encryptedKey: bytesToBase64(encryptedKey), ciphertext: bytesToBase64(ciphertext),
    });
    $("#encrypt-result").hidden = false;
    toast("メッセージを暗号化しました。");
  });
});

$("#decrypt-button").addEventListener("click", async () => {
  const button = $("#decrypt-button");
  await withBusy(button, async () => {
    const envelope = unarmor("MESSAGE", $("#decrypt-message").value);
    const privateKeys = await revealPrivateKeys($("#decrypt-private-key").value, $("#decrypt-passphrase").value);
    if (envelope.recipient && privateKeys.identity?.fingerprint !== envelope.recipient) throw new Error("このメッセージは別の公開鍵で暗号化されています。");
    const privateKey = await cryptoApi.subtle.importKey("jwk", privateKeys.encryptionKey, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);
    const rawKey = await cryptoApi.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, base64ToBytes(envelope.encryptedKey));
    const contentKey = await cryptoApi.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
    try {
      const plaintext = await cryptoApi.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(envelope.iv) }, contentKey, base64ToBytes(envelope.ciphertext));
      $("#decrypted-output").value = decoder.decode(plaintext);
      $("#decrypt-result").hidden = false;
      toast("メッセージを復号しました。");
    } catch { throw new Error("復号できません。暗号文が壊れている可能性があります。"); }
  });
});

$("#sign-button").addEventListener("click", async () => {
  const button = $("#sign-button");
  await withBusy(button, async () => {
    const message = $("#sign-message").value;
    if (!message) throw new Error("署名するメッセージを入力してください。");
    const privateKeys = await revealPrivateKeys($("#sign-private-key").value, $("#sign-passphrase").value);
    const key = await cryptoApi.subtle.importKey("jwk", privateKeys.signingKey, { name: "RSA-PSS", hash: "SHA-256" }, false, ["sign"]);
    const signature = await cryptoApi.subtle.sign({ name: "RSA-PSS", saltLength: 32 }, key, encoder.encode(message));
    $("#signature-output").value = armor("SIGNATURE", { version: 1, signer: privateKeys.identity?.fingerprint, algorithm: "RSA-PSS-SHA256", signature: bytesToBase64(signature) });
    $("#sign-result").hidden = false;
    toast("署名を作成しました。");
  });
});

$("#verify-button").addEventListener("click", async () => {
  const button = $("#verify-button");
  await withBusy(button, async () => {
    const bundle = publicBundle($("#verify-public-key").value);
    const signature = unarmor("SIGNATURE", $("#verify-signature").value);
    const key = await cryptoApi.subtle.importKey("jwk", bundle.signingKey, { name: "RSA-PSS", hash: "SHA-256" }, false, ["verify"]);
    const valid = await cryptoApi.subtle.verify({ name: "RSA-PSS", saltLength: 32 }, key, base64ToBytes(signature.signature), encoder.encode($("#verify-message").value));
    const result = $("#verify-result");
    result.hidden = false;
    result.className = `verification ${valid ? "valid" : "invalid"}`;
    result.textContent = valid ? "✓ 署名は有効です。メッセージは改ざんされていません。" : "× 署名を確認できません。内容または鍵が一致していません。";
  });
});

$$('[data-use-public]').forEach((button) => button.addEventListener("click", () => {
  if (!state.publicArmor) return toast("先に鍵を作成またはインポートしてください。", true);
  $("#encrypt-public-key").value = state.publicArmor;
  toast("読み込み済みの公開鍵を入力しました。");
}));

$$('[data-use-private]').forEach((button) => button.addEventListener("click", () => {
  if (!state.privateArmor) return toast("先に鍵を作成またはインポートしてください。", true);
  const target = button.dataset.usePrivate === "sign" ? "#sign-private-key" : "#decrypt-private-key";
  $(target).value = state.privateArmor;
  toast("読み込み済みの秘密鍵を入力しました。");
}));

$$('[data-copy]').forEach((button) => button.addEventListener("click", async () => {
  const value = $(button.dataset.copy).value;
  await navigator.clipboard.writeText(value);
  toast("クリップボードにコピーしました。");
}));

$$('[data-download]').forEach((button) => button.addEventListener("click", () => {
  const content = $(button.dataset.download).value;
  if (!content) return toast("保存する内容がありません。", true);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  link.download = button.dataset.filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}));

$$('[data-qr]').forEach((button) => button.addEventListener("click", async () => {
  await withBusy(button, () => showQrCode(button));
}));

$("[data-close-qr]").addEventListener("click", () => $("#qr-dialog").close());

$("#save-qr-button").addEventListener("click", () => {
  $("#qr-canvas").toBlob((blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "webcrypto-qr.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }, "image/png");
});

if (!cryptoApi?.subtle) {
  toast("このブラウザは WebCrypto API に対応していません。", true);
  $$("button").forEach((button) => { button.disabled = true; });
}

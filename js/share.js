/* Baby Roulette : liens à partager.
   Nouveaux liens : #/<jeu>?d=<JSON encodé en base64url>.
   Anciens liens (genderReveal.html?q=…) : encore lus, voir decodeLegacy() et 404.html. */

/* ---------------------------------------------------- Encodage */

function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64(value) {
  let s = String(value).trim()
    .replace(/ /g, "+")            // un « + » devient une espace dans une adresse : on le rétablit
    .replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return atob(s);
}

export function encodeData(data) {
  return toBase64Url(JSON.stringify(data));
}

export function decodeData(value) {
  try {
    const bin = fromBase64(value);
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

// Format de la première version : btoa(encodeURIComponent("a;b;c"))
export function decodeLegacy(value) {
  try {
    return decodeURIComponent(fromBase64(value)).split(";");
  } catch {
    return null;
  }
}

// Lit les paramètres d’une page de jeu : { data } (nouveau format), { legacy } (ancien), ou {} (démo)
export function readParams(params) {
  if (params.has("d")) {
    const data = decodeData(params.get("d"));
    return data ? { data } : { broken: true };
  }
  if (params.has("q")) {
    const legacy = decodeLegacy(params.get("q"));
    return legacy ? { legacy } : { broken: true };
  }
  return {};
}

/* ---------------------------------------------------- Adresses */

export function baseUrl() {
  return location.origin + location.pathname.replace(/index\.html$/, "");
}

export function gameLink(route, data, extra = "") {
  return `${baseUrl()}#/${route}?d=${encodeData(data)}${extra}`;
}

/* ---------------------------------------------------- Copier / partager */

export async function copyText(text, fallbackInput) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (!fallbackInput) return false;
    fallbackInput.select();
    try { return document.execCommand("copy"); } catch { return false; }
  }
}

export const canShare = () => typeof navigator.share === "function";

export async function shareLink(url, title) {
  try {
    await navigator.share({ title: title || "Baby Roulette", url });
  } catch {
    /* partage annulé */
  }
}

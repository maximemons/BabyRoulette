/* Baby Roulette : petits outils d’interface (éléments, feuilles, liens à partager, toasts) */

import { t } from "./i18n.js";
import { copyText, canShare, shareLink } from "./share.js";

/* ---------------------------------------------------- Éléments */

// h("button", { class: "btn", onclick: fn }, "Texte") : le texte passe toujours par textContent,
// jamais par innerHTML, pour qu’un lien partagé ne puisse pas injecter de code.
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null || value === false) continue;
    if (key === "class") el.className = value;
    else if (key === "style" && typeof value === "object") {
      for (const [prop, v] of Object.entries(value)) {
        if (prop.startsWith("--")) el.style.setProperty(prop, String(v));
        else el.style[prop] = v;
      }
    }
    else if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2), value);
    else if (key === "value") el.value = value;
    else if (key === "checked") el.checked = !!value;
    else el.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }
  return el;
}

export const svg = (markup, cls = "") => {
  const span = document.createElement("span");
  span.className = `ico ${cls}`.trim();
  span.setAttribute("aria-hidden", "true");
  span.innerHTML = markup; // icônes statiques du code, jamais de contenu utilisateur
  return span;
};

export const ICONS = {
  copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5"/><path d="M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12"/></svg>',
  open: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><path d="M19 8a7.5 7.5 0 1 0 .9 6"/><path d="M19.5 3.5V8H15"/></svg>',
  backspace: '<svg viewBox="0 0 24 24"><path d="M9 5h10.5A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5H9l-6-7z"/><path d="M12 9.5l5 5M17 9.5l-5 5"/></svg>'
};

export function button(label, { variant = "primary", icon, onclick, type = "button", ...rest } = {}) {
  return h("button", { class: `btn btn-${variant}`, type, onclick, ...rest },
    icon ? svg(ICONS[icon] || icon) : null,
    h("span", null, label)
  );
}

/* ---------------------------------------------------- Formulaires */

let fieldSeq = 0;

// Champ libellé + saisie. `optional` ajoute la mention « facultatif ».
export function field(label, input, { optional = false, hint } = {}) {
  const id = input.id || `f${++fieldSeq}`;
  input.id = id;
  return h("div", { class: "field" },
    h("label", { for: id },
      label,
      optional ? h("span", { class: "field-optional" }, t("optional")) : null
    ),
    input,
    hint ? h("p", { class: "field-hint" }, hint) : null
  );
}

export const input = (attrs = {}) => h("input", { type: "text", autocomplete: "off", ...attrs });

// Valeur saisie, ou à défaut le texte d’exemple affiché dans le champ
export const valueOr = el => el.value.trim() || el.placeholder || "";

/* ---------------------------------------------------- Feuilles (fenêtres) */

let openSheets = 0;

export function openSheet({ title, content, actions = [], onClose, dismissible = true, tone }) {
  const root = document.getElementById("sheet-root");
  const previous = document.activeElement;
  let closed = false;

  const titleId = `sheet-title-${Date.now()}`;
  const panel = h("div", {
    class: `sheet ${tone ? `sheet--${tone}` : ""}`,
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": title ? titleId : null,
    tabindex: "-1"
  },
    dismissible ? h("button", { class: "icon-btn sheet-close", type: "button", "aria-label": t("cancel"), onclick: () => close() }, svg(ICONS.close)) : null,
    title ? h("h2", { class: "sheet-title", id: titleId }, title) : null,
    h("div", { class: "sheet-body" }, content),
    actions.length ? h("div", { class: "sheet-actions" }, actions) : null
  );
  const wrap = h("div", { class: "sheet-wrap" },
    h("div", { class: "sheet-backdrop", onclick: () => dismissible && close() }),
    panel
  );

  function onKey(e) {
    if (e.key === "Escape" && dismissible) close();
    if (e.key === "Tab") trapFocus(e, panel);
  }

  function close(silent) {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKey);
    wrap.classList.add("is-closing");
    setTimeout(() => wrap.remove(), 200);
    if (--openSheets === 0) document.body.classList.remove("no-scroll");
    if (previous && previous.focus) previous.focus();
    if (!silent && onClose) onClose();
  }

  root.append(wrap);
  openSheets++;
  document.body.classList.add("no-scroll");
  document.addEventListener("keydown", onKey);
  requestAnimationFrame(() => {
    const first = panel.querySelector("input, select, textarea");
    (first || panel).focus({ preventScroll: true });
  });
  return { close, panel };
}

export function closeAllSheets() {
  document.querySelectorAll("#sheet-root .sheet-wrap").forEach(w => w.remove());
  openSheets = 0;
  document.body.classList.remove("no-scroll");
}

function trapFocus(e, panel) {
  const items = [...panel.querySelectorAll("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])")]
    .filter(el => !el.disabled && el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ---------------------------------------------------- Lien à partager */

// Bloc « lien + Copier + Partager + Ouvrir »
export function linkBox(url, { label, shareTitle } = {}) {
  const field = h("input", { class: "link-input", type: "text", readonly: true, value: url, "aria-label": label || t("shareTitle"), onfocus: e => e.target.select() });
  const copyBtn = button(t("copy"), { variant: "primary", icon: "copy" });
  copyBtn.addEventListener("click", async () => {
    const ok = await copyText(url, field);
    if (!ok) return;
    copyBtn.classList.add("is-done");
    copyBtn.replaceChildren(svg(ICONS.check), h("span", null, t("copied")));
    setTimeout(() => {
      copyBtn.classList.remove("is-done");
      copyBtn.replaceChildren(svg(ICONS.copy), h("span", null, t("copy")));
    }, 1600);
  });

  return h("div", { class: "link-box" },
    label ? h("p", { class: "link-label" }, label) : null,
    field,
    h("div", { class: "link-actions" },
      copyBtn,
      canShare() ? button(t("share"), { variant: "ghost", icon: "share", onclick: () => shareLink(url, shareTitle) }) : null,
      h("a", { class: "btn btn-ghost", href: url, target: "_blank", rel: "noopener" }, svg(ICONS.open), h("span", null, t("openLink")))
    )
  );
}

/* ---------------------------------------------------- Toasts */

export function toast(message, ms = 2600) {
  const root = document.getElementById("toast-root");
  const el = h("div", { class: "toast", role: "status" }, message);
  root.append(el);
  setTimeout(() => el.classList.add("is-leaving"), ms);
  setTimeout(() => el.remove(), ms + 300);
}

/* ---------------------------------------------------- Divers */

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const wait = ms => new Promise(r => setTimeout(r, ms));

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Premier caractère visible (un emoji composé compte pour un seul)
export function firstGrapheme(text) {
  const s = (text || "").trim();
  if (!s) return "";
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const it = new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)[Symbol.iterator]();
    return it.next().value?.segment || s;
  }
  return [...s].slice(0, 2).join("");
}

/* ---------------------------------------------------- Blocs communs aux jeux */

export function demoBanner(onCreate) {
  return h("div", { class: "demo-banner" },
    h("span", { class: "demo-badge" }, t("demoBadge")),
    h("p", null, t("demoNote")),
    button(t("createYours"), { variant: "primary", icon: "plus", onclick: onCreate })
  );
}

export const brokenNotice = () => h("p", { class: "notice notice--error", role: "alert" }, t("linkBroken"));

export const madeWith = () => h("p", { class: "made-with" }, h("a", { href: "#/" }, t("madeWith")));

// Retire ?create=1 de l’adresse une fois le formulaire ouvert (sans recharger la page)
export function clearCreateFlag(route) {
  history.replaceState(null, "", `#/${route}`);
}

// Fenêtre finale de création : un ou plusieurs liens à envoyer
export function showLinks(links, shareTitle) {
  return openSheet({
    title: t("shareTitle"),
    tone: "success",
    content: h("div", { class: "links" }, links.map(l => linkBox(l.url, { label: l.label, shareTitle })))
  });
}

export function fieldset(legend, content) {
  return h("fieldset", { class: "field" }, h("legend", null, legend), content);
}

/* Baby Roulette : Motus du prénom (ancien wordle.html)
   Données du lien : { k: "wordle", n: prénom, t: titre, s: message de réussite,
                       x: message d’échec, a: révélation après échec (vide = aucune) } */

import { t, lang, NAMES } from "./i18n.js";
import {
  h, svg, ICONS, button, field, input, valueOr, openSheet, showLinks, toast,
  demoBanner, brokenNotice, madeWith, clearCreateFlag, wait
} from "./ui.js";
import { readParams, gameLink } from "./share.js";
import { confetti, puff } from "./effects.js";

const ROUTE = "name-reveal";
const MAX_TRIES = 6;
const MAX_LENGTH = 20;
const KB_KEY = "br-keyboard";
const LAYOUTS = {
  azerty: ["azertyuiop", "qsdfghjklm", "wxcvbn"],
  qwerty: ["qwertyuiop", "asdfghjkl", "zxcvbnm"]
};
const RANK = { absent: 1, present: 2, correct: 3 };

// « Élodie » → « elodie » : sans accents, en minuscules
export function normalize(text) {
  return String(text || "").trim()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/œ/gi, "oe").replace(/æ/gi, "ae").replace(/ß/g, "ss")
    .toLowerCase();
}

const isLetter = c => /^[a-z]$/.test(c);

function readConfig(params) {
  const { data, legacy, broken } = readParams(params);
  if (data && data.k === "wordle" && data.n) {
    return { shared: true, name: data.n, title: data.t, success: data.s, fail: data.x, anyway: data.a || "" };
  }
  if (legacy && legacy.length >= 5 && legacy[0]) {
    const [name, title, success, fail, ...anyway] = legacy;
    return { shared: true, name, title, success, fail, anyway: anyway.join(";") };
  }
  if (data || legacy || broken) return { broken: true };
  return { shared: false };
}

export function mount(root, { params }) {
  const cfg = readConfig(params);
  const demo = !cfg.shared;
  const list = NAMES[lang()] || NAMES.en;
  const shownName = demo ? list[Math.floor(Math.random() * list.length)] : cfg.name;
  const word = [...normalize(shownName)].slice(0, MAX_LENGTH);
  const L = word.length;
  const title = cfg.title || t("wordle.title");
  document.title = title;

  let layout = loadLayout();
  let row = 0;
  let over = false;
  let revealing = false;
  const known = word.map(c => (isLetter(c) ? null : c));     // lettres sûres (bien placées) et caractères fixes
  const firstIdx = word.findIndex(isLetter);
  if (firstIdx >= 0) known[firstIdx] = word[firstIdx];
  let current = [...known];
  const keyStates = {};

  /* -------------------------------------------- Plateau */

  const board = h("div", { class: "board", style: { "--len": L }, role: "grid", "aria-label": title });
  const rows = Array.from({ length: MAX_TRIES }, () => {
    const cells = word.map(c => h("div", { class: `cell${isLetter(c) ? "" : " is-fixed"}`, role: "gridcell" }));
    const el = h("div", { class: "board-row", role: "row" }, cells);
    board.append(el);
    return { el, cells };
  });

  const keyboard = h("div", { class: "keyboard", "aria-label": t("wordle.keyboard") });
  const layoutBtn = h("button", { class: "link-btn", type: "button", onclick: toggleLayout });

  root.append(
    h("section", { class: "game game--wordle" },
      cfg.broken ? brokenNotice() : null,
      h("h1", { class: "game-title" }, title),
      h("div", { class: "board-wrap" }, board),
      keyboard,
      h("div", { class: "keyboard-foot" }, layoutBtn),
      demo ? demoBanner(openCreator) : madeWith()
    )
  );

  buildKeyboard();
  paintRow();

  if (demo && params.has("create")) {
    clearCreateFlag(ROUTE);
    openCreator();
  }

  document.addEventListener("keydown", onKeydown);

  /* -------------------------------------------- Clavier */

  function loadLayout() {
    try {
      const saved = localStorage.getItem(KB_KEY);
      if (saved in LAYOUTS) return saved;
    } catch {}
    return lang() === "fr" ? "azerty" : "qwerty";
  }

  function toggleLayout() {
    layout = layout === "azerty" ? "qwerty" : "azerty";
    try { localStorage.setItem(KB_KEY, layout); } catch {}
    buildKeyboard();
  }

  function buildKeyboard() {
    const lines = LAYOUTS[layout];
    keyboard.replaceChildren(...lines.map((line, i) => {
      const keys = [...line].map(l => h("button", {
        class: "key", type: "button", "data-key": l,
        "data-state": keyStates[l] || null,
        onclick: () => typeLetter(l)
      }, l.toUpperCase()));
      if (i === lines.length - 1) {
        keys.unshift(h("button", { class: "key key--wide key--enter", type: "button", onclick: submit }, t("wordle.enter")));
        keys.push(h("button", { class: "key key--wide", type: "button", "aria-label": "⌫", onclick: erase }, svg(ICONS.backspace)));
      }
      return h("div", { class: "keyboard-row" }, keys);
    }));
    layoutBtn.textContent = t(layout === "azerty" ? "wordle.toQwerty" : "wordle.toAzerty");
  }

  function onKeydown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector("#sheet-root .sheet-wrap")) return;
    if (e.target.closest && e.target.closest("input, textarea, select")) return;
    if (e.key === "Enter") { e.preventDefault(); submit(); return; }
    if (e.key === "Backspace") { e.preventDefault(); erase(); return; }
    const l = normalize(e.key);
    if (isLetter(l)) typeLetter(l);
  }

  /* -------------------------------------------- Saisie */

  function typeLetter(letter) {
    if (over || revealing) return;
    const i = current.findIndex((c, idx) => c == null && known[idx] == null);
    if (i < 0) return;
    current[i] = letter;
    paintRow(i);
  }

  function erase() {
    if (over || revealing) return;
    for (let i = L - 1; i >= 0; i--) {
      if (known[i] == null && current[i] != null) {
        current[i] = null;
        paintRow();
        return;
      }
    }
  }

  function paintRow(popIdx) {
    rows[row].cells.forEach((cell, i) => {
      const c = current[i];
      cell.textContent = c && c !== " " ? c.toUpperCase() : "";
      cell.classList.toggle("is-filled", c != null && isLetter(word[i]));
      cell.classList.toggle("is-hint", known[i] != null && isLetter(word[i]));
      if (i === popIdx) {
        cell.classList.remove("is-pop");
        void cell.offsetWidth;
        cell.classList.add("is-pop");
      }
    });
  }

  function score(guess) {
    const states = word.map(c => (isLetter(c) ? "absent" : "fixed"));
    const left = {};
    word.forEach((c, i) => {
      if (!isLetter(c)) return;
      if (guess[i] === c) states[i] = "correct";
      else left[c] = (left[c] || 0) + 1;
    });
    word.forEach((c, i) => {
      if (states[i] !== "absent") return;
      const g = guess[i];
      if (left[g] > 0) { states[i] = "present"; left[g]--; }
    });
    return states;
  }

  async function submit() {
    if (over || revealing) return;
    if (current.some(c => c == null)) {
      const r = rows[row].el;
      r.classList.remove("is-shake");
      void r.offsetWidth;
      r.classList.add("is-shake");
      toast(t("wordle.notEnough"));
      return;
    }

    revealing = true;
    const guess = [...current];
    const states = score(guess);
    rows[row].cells.forEach((cell, i) => {
      if (states[i] === "fixed") return;
      cell.style.setProperty("--d", `${i * 110}ms`);
      cell.dataset.state = states[i];
      cell.classList.remove("is-hint", "is-pop");
    });
    rows[row].el.setAttribute("aria-label", guess.join("").toUpperCase());
    await wait(L * 110 + 450);

    guess.forEach((g, i) => {
      if (states[i] === "fixed") return;
      if ((RANK[states[i]] || 0) > (RANK[keyStates[g]] || 0)) keyStates[g] = states[i];
      if (states[i] === "correct") known[i] = g;
    });
    keyboard.querySelectorAll(".key[data-key]").forEach(k => {
      const s = keyStates[k.dataset.key];
      if (s) k.dataset.state = s; else delete k.dataset.state;
    });
    revealing = false;

    const won = states.every(s => s === "correct" || s === "fixed");
    if (won) return finish(true);
    row++;
    if (row >= MAX_TRIES) return finish(false);
    current = [...known];
    paintRow();
  }

  /* -------------------------------------------- Fin de partie */

  async function finish(won) {
    over = true;
    document.removeEventListener("keydown", onKeydown);
    keyboard.classList.add("is-off");
    if (won) confetti();
    else puff(board);
    await wait(won ? 1300 : 900);
    if (!document.body.contains(board)) return;

    if (demo) return demoEnd();

    if (won) {
      openSheet({
        title: cfg.success || t("wordle.fSuccessPh") + shownName,
        tone: "success",
        content: h("p", { class: "reveal-name" }, shownName)
      });
      return;
    }
    const sheet = openSheet({
      title: cfg.fail || t("wordle.fFailPh"),
      content: null,
      actions: cfg.anyway ? [button(t("continue"), { variant: "primary", onclick: revealAnyway })] : []
    });
    function revealAnyway() {
      sheet.close(true);
      openSheet({ title: cfg.anyway, tone: "success", content: h("p", { class: "reveal-name" }, shownName) });
      confetti();
    }
  }

  function demoEnd() {
    const sheet = openSheet({
      title: t("wordle.demoEndTitle"),
      content: h("p", { class: "sheet-lead" }, t("wordle.demoEndText")),
      actions: [
        button(t("cancel"), { variant: "ghost", onclick: () => sheet.close() }),
        button(t("createYours"), { variant: "primary", icon: "plus", onclick: () => { sheet.close(true); openCreator(); } })
      ]
    });
  }

  return () => document.removeEventListener("keydown", onKeydown);
}

/* -------------------------------------------- Création d’un Motus */

function openCreator() {
  const title = input({ placeholder: t("wordle.fTitlePh"), maxlength: 60 });
  const name = input({ maxlength: MAX_LENGTH, autocapitalize: "words", required: true });
  const success = input({ placeholder: t("wordle.fSuccessPh"), maxlength: 120 });
  const fail = input({ placeholder: t("wordle.fFailPh"), maxlength: 120 });
  const anyway = input({ placeholder: t("wordle.fAnywayPh"), maxlength: 120 });
  const reveal = h("input", { type: "checkbox", checked: true, onchange: () => { anyway.disabled = !reveal.checked; } });
  const nameField = field(t("wordle.fName"), name);
  const error = h("p", { class: "field-error", role: "alert" });
  nameField.append(error);

  name.addEventListener("input", () => {
    const n = name.value.trim();
    success.placeholder = t("wordle.fSuccessPh") + n;
    anyway.placeholder = t("wordle.fAnywayPh") + n;
    if (error.textContent) validate();
  });

  function validate() {
    const letters = [...normalize(name.value)].filter(isLetter).length;
    const ok = letters >= 2;
    error.textContent = ok ? "" : (name.value.trim() ? t("wordle.nameShort") : t("required"));
    name.setAttribute("aria-invalid", ok ? "false" : "true");
    return ok;
  }

  const sheet = openSheet({
    title: t("wordle.name"),
    content: h("div", { class: "form" },
      field(t("wordle.fTitle"), title),
      nameField,
      field(t("wordle.fSuccess"), success),
      field(t("wordle.fFail"), fail),
      h("div", { class: "field" },
        h("label", { class: "check" }, reveal, h("span", null, t("wordle.fAnyway"))),
        anyway
      )
    ),
    actions: [
      button(t("cancel"), { variant: "ghost", onclick: () => sheet.close() }),
      button(t("createLink"), { variant: "primary", onclick: submit })
    ]
  });

  function submit() {
    if (!validate()) { name.focus(); return; }
    const data = {
      k: "wordle",
      n: name.value.trim(),
      t: valueOr(title),
      s: valueOr(success),
      x: valueOr(fail),
      a: reveal.checked ? valueOr(anyway) : ""
    };
    sheet.close(true);
    showLinks([{ url: gameLink(ROUTE, data) }], data.t);
  }
}

/* Baby Roulette : navigation, en-tête, accueil, à propos, page introuvable */

import { t, lang, setLang, LANGS, LANG_NAMES, NAMES } from "./i18n.js";
import { h, closeAllSheets } from "./ui.js";
import { addView, getViews } from "./counter.js";
import * as slot from "./slot.js";
import * as wordle from "./wordle.js";
import * as tournament from "./tournament.js";

/* =========================================================
   Routes
   ========================================================= */

const ROUTES = {
  "": { name: "home", page: "index", mount: mountHome },
  "gender-reveal": { name: "slot", page: "genderreveal", mount: slot.mount },
  "name-reveal": { name: "wordle", page: "wordle", mount: wordle.mount },
  "name-tournament": { name: "tournament", page: "nametournament", mount: tournament.mount },
  "about": { name: "about", page: "about", mount: mountAbout }
};
const NOT_FOUND = { name: "notfound", page: null, mount: mountNotFound };

const GAMES = [
  { route: "gender-reveal", key: "slot", color: "pink", art: artSlot },
  { route: "name-reveal", key: "wordle", color: "blue", art: artWordle },
  { route: "name-tournament", key: "tour", color: "butter", art: artTournament }
];

const view = document.getElementById("view");
const backBtn = document.getElementById("btn-back");
let cleanup = null;
let lastPath = null;

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const cut = raw.indexOf("?");
  const path = (cut < 0 ? raw : raw.slice(0, cut)).replace(/\/+$/, "");
  const params = new URLSearchParams(cut < 0 ? "" : raw.slice(cut + 1));
  return { path, params };
}

function render() {
  if (cleanup) cleanup();
  cleanup = null;
  closeAllSheets();

  const { path, params } = parseHash();
  const route = ROUTES[path] || NOT_FOUND;

  document.title = "Baby Roulette";
  view.className = `view view--${route.name}`;
  view.replaceChildren();
  backBtn.classList.toggle("hidden", path === "");

  cleanup = route.mount(view, { params }) || null;

  if (path !== lastPath) {
    if (route.page) addView(route.page);
    window.scrollTo(0, 0);
  }
  lastPath = path;
}

/* =========================================================
   En-tête, pied de page, langue
   ========================================================= */

function translateShell() {
  document.documentElement.lang = lang();
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  backBtn.setAttribute("aria-label", t("back"));
  document.getElementById("lang-label").textContent = t("language");
}

function initLang() {
  const select = document.getElementById("lang-select");
  select.replaceChildren(...LANGS.map(l => h("option", { value: l }, LANG_NAMES[l])));
  select.value = lang();
  select.addEventListener("change", () => {
    setLang(select.value);
    translateShell();
    render();
  });
}

/* =========================================================
   Accueil
   ========================================================= */

function mountHome(root) {
  const blocks = [
    { letter: "B", color: "blue" },
    { letter: "A", color: "pink" },
    { letter: "B", color: "butter" },
    { letter: "Y", color: "mint" }
  ];

  root.append(
    h("section", { class: "hero" },
      h("div", { class: "hero-blocks", "aria-hidden": "true" },
        blocks.map((b, i) => h("span", { class: `toy-block toy-block--${b.color}`, style: { "--i": i } }, b.letter))
      ),
      h("h1", { class: "hero-title" }, h("span", { class: "sr-only" }, "Baby "), "Roulette"),
      h("p", { class: "hero-lead" }, t("tagline"))
    ),

    h("section", { class: "home-section", "aria-labelledby": "games-title" },
      h("h2", { class: "section-title", id: "games-title" }, t("gamesTitle")),
      h("ul", { class: "game-list" },
        GAMES.map(g => h("li", { class: `game-card game-card--${g.color}` },
          h("a", { class: "game-card-art", href: `#/${g.route}`, tabindex: "-1", "aria-hidden": "true" }, g.art()),
          h("div", { class: "game-card-body" },
            h("h3", null, h("a", { href: `#/${g.route}` }, t(`${g.key}.name`))),
            h("p", null, t(`${g.key}.desc`)),
            h("div", { class: "game-card-actions" },
              h("a", { class: "btn btn-primary", href: `#/${g.route}` }, t("tryIt")),
              h("a", { class: "btn btn-ghost", href: `#/${g.route}?create=1` }, t("createYours"))
            )
          )
        ))
      )
    ),

    h("section", { class: "home-section", "aria-labelledby": "how-title" },
      h("h2", { class: "section-title", id: "how-title" }, t("howTitle")),
      h("ol", { class: "steps" },
        ["step1", "step2", "step3"].map(k => h("li", null, h("p", null, t(k))))
      )
    )
  );
}

function artSlot() {
  return h("div", { class: "art art-slot" },
    h("span", null, "♂"), h("span", null, "?"), h("span", null, "♀")
  );
}

function artWordle() {
  const tiles = [["B", "ok"], ["A", "near"], ["B", "ok"], ["Y", ""], ["", ""]];
  return h("div", { class: "art art-wordle" }, tiles.map(([l, s]) => h("span", { class: s }, l)));
}

function artTournament() {
  const names = NAMES[lang()] || NAMES.en;
  return h("div", { class: "art art-tour" },
    h("span", null, names[0]), h("i", null, "vs"), h("span", null, names[names.length - 1])
  );
}

/* =========================================================
   À propos (statistiques de visite)
   ========================================================= */

function mountAbout(root) {
  const rows = [
    ["", t("statsTotal")],
    ["index", t("statsHome")],
    ["genderreveal", t("slot.name")],
    ["wordle", t("wordle.name")],
    ["nametournament", t("tour.name")],
    ["about", t("about")]
  ];
  document.title = `${t("about")} · Baby Roulette`;

  const list = h("dl", { class: "stats" });
  rows.forEach(([page, label]) => {
    const value = h("dd", null, "…");
    list.append(h("div", { class: page ? "" : "stats-total" }, h("dt", null, label), value));
    getViews(page)
      .then(n => { value.textContent = n.toLocaleString(lang()); })
      .catch(() => { value.textContent = "—"; });
  });

  root.append(
    h("section", { class: "panel" },
      h("h1", { class: "page-title" }, t("statsTitle")),
      list
    )
  );
}

/* =========================================================
   Page introuvable
   ========================================================= */

function mountNotFound(root) {
  const babies = ["👶🏻", "👶🏼", "👶🏽", "👶🏾", "👶🏿"];
  document.title = `${t("nf.page")} · Baby Roulette`;
  root.append(
    h("section", { class: "notfound" },
      h("p", { class: "notfound-code", "aria-hidden": "true" },
        h("span", null, "4"), h("span", { class: "notfound-baby" }, babies[Math.floor(Math.random() * babies.length)]), h("span", null, "4")
      ),
      h("h1", { class: "page-title" }, t("nf.page")),
      h("p", { class: "muted" }, t("nf.lead")),
      h("a", { class: "btn btn-primary", href: "#/" }, t("nf.home"))
    )
  );
}

/* =========================================================
   Démarrage
   ========================================================= */

document.getElementById("year").textContent = new Date().getFullYear();
initLang();
translateShell();
render();
window.addEventListener("hashchange", render);

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

/* Baby Roulette : tournoi de prénoms (ancien nameTournament.html)
   Données du lien : { k: "tour", t: titre, n: [prénoms], u: identifiant des compteurs de votes }
   Avec « &result=1 » (ou l’ancien « &result=true ») : page des résultats. */

import { t, lang, NAMES } from "./i18n.js";
import {
  h, svg, ICONS, button, field, input, valueOr, openSheet, showLinks, linkBox, toast,
  demoBanner, brokenNotice, madeWith, clearCreateFlag, shuffle, wait
} from "./ui.js";
import { readParams, gameLink } from "./share.js";
import { hit, get, set } from "./counter.js";
import { confetti } from "./effects.js";

const ROUTE = "name-tournament";
const MAX_NAMES = 32;
const AUTO_KEY = "autoRefresh";
const AUTO_EVERY = 30 * 1000;

function readConfig(params) {
  const { data, legacy, broken } = readParams(params);
  if (data && data.k === "tour" && Array.isArray(data.n) && data.n.length > 1) {
    return { shared: true, title: data.t, names: data.n.map(String), uuid: data.u || "" };
  }
  if (legacy && legacy.length >= 3) {
    try {
      const names = JSON.parse(legacy.slice(1, -1).join(";"));
      if (Array.isArray(names) && names.length > 1) {
        return { shared: true, title: legacy[0], names: names.map(String), uuid: legacy[legacy.length - 1] };
      }
    } catch { /* lien abîmé */ }
  }
  if (data || legacy || broken) return { broken: true };
  return { shared: false };
}

export function mount(root, { params }) {
  const cfg = readConfig(params);
  const title = cfg.title || t("tour.title");
  document.title = title;

  if (cfg.shared && params.has("result")) return mountResults(root, cfg, title);
  return mountPlay(root, cfg, title, params);
}

/* =========================================================
   Jouer
   ========================================================= */

function mountPlay(root, cfg, title, params) {
  const demo = !cfg.shared;
  let names;
  if (demo) {
    const list = NAMES[lang()] || NAMES.en;
    const half = list.length / 2;
    names = Math.random() < 0.5 ? list.slice(0, half) : list.slice(half);
  } else {
    names = cfg.names;
  }

  const stage = h("div", { class: "tour-stage" });
  root.append(
    h("section", { class: "game game--tour" },
      cfg.broken ? brokenNotice() : null,
      h("h1", { class: "game-title" }, title),
      stage,
      demo ? demoBanner(openCreator) : madeWith()
    )
  );

  let round, next, idx, roundNo, total, alive = true;

  function start() {
    round = shuffle(names);
    next = [];
    idx = 0;
    roundNo = 1;
    total = Math.max(1, Math.ceil(Math.log2(round.length)));
    step();
  }

  function step() {
    if (!alive) return;
    if (round.length === 1) return showWinner(round[0]);
    if (idx >= round.length) {
      round = next;
      next = [];
      idx = 0;
      roundNo++;
      return step();
    }
    const a = round[idx], b = round[idx + 1];
    if (b === undefined) {          // nombre impair : qualifié d’office
      next.push(a);
      idx += 2;
      return step();
    }
    showDuel(a, b);
  }

  function showDuel(a, b) {
    const matches = Math.floor(round.length / 2);
    const pills = h("ol", { class: "tour-rounds", "aria-label": t("tour.round") },
      Array.from({ length: total }, (_, i) => h("li", {
        class: i + 1 === roundNo ? "is-current" : i + 1 < roundNo ? "is-done" : "",
        "aria-current": i + 1 === roundNo ? "step" : null
      }, `${t("tour.round")} ${i + 1}`))
    );

    let locked = false;
    const pick = (winner, btn, other) => async () => {
      if (locked) return;
      locked = true;
      btn.classList.add("is-picked");
      other.classList.add("is-out");
      next.push(winner);
      idx += 2;
      await wait(320);
      step();
    };
    const btnA = h("button", { class: "choice choice--a", type: "button" }, a);
    const btnB = h("button", { class: "choice choice--b", type: "button" }, b);
    btnA.addEventListener("click", pick(a, btnA, btnB));
    btnB.addEventListener("click", pick(b, btnB, btnA));

    stage.replaceChildren(
      pills,
      h("p", { class: "tour-prompt" }, t("tour.makeChoice")),
      h("p", { class: "tour-progress" }, `${t("tour.match")} ${idx / 2 + 1} ${t("tour.of")} ${matches}`),
      h("div", { class: "duel" }, btnA, h("span", { class: "duel-vs", "aria-hidden": "true" }, "vs"), btnB)
    );
  }

  function showWinner(name) {
    stage.replaceChildren(
      h("div", { class: "winner" },
        h("p", { class: "winner-label" }, t("tour.final")),
        h("p", { class: "winner-name" }, name),
        h("div", { class: "winner-actions" },
          button(t("tour.playAgain"), { variant: "ghost", icon: "refresh", onclick: start })
        )
      )
    );
    confetti();
    if (!demo && cfg.uuid) {
      hit(cfg.uuid + name).then(() => toast(t("tour.voteSaved"))).catch(() => {});
    }
  }

  start();

  if (demo && params.has("create")) {
    clearCreateFlag(ROUTE);
    openCreator();
  }

  return () => { alive = false; };
}

/* =========================================================
   Résultats
   ========================================================= */

function mountResults(root, cfg, title) {
  const podium = h("div", { class: "podium" });
  const ranking = h("ol", { class: "ranking" });
  const status = h("p", { class: "notice", role: "status" }, "…");
  const auto = h("input", { type: "checkbox" });
  let timer = null;
  let first = true;
  let alive = true;

  const playUrl = gameLink(ROUTE, { k: "tour", t: title, n: cfg.names, u: cfg.uuid });

  root.append(
    h("section", { class: "game game--tour game--results" },
      h("h1", { class: "game-title" }, title),
      status,
      podium,
      h("div", { class: "results-block" },
        h("div", { class: "results-head" },
          h("h2", { class: "section-title" }, t("tour.ranking")),
          button(t("tour.refresh"), { variant: "ghost", icon: "refresh", onclick: () => load() })
        ),
        ranking,
        h("label", { class: "check", title: t("tour.every30") },
          auto, h("span", null, `${t("tour.autoRefresh")} (${t("tour.every30").toLowerCase()})`)
        )
      ),
      h("div", { class: "results-block" }, linkBox(playUrl, { label: t("tour.playLink"), shareTitle: title }))
    )
  );

  auto.checked = sessionStorage.getItem(AUTO_KEY) === "true";
  auto.addEventListener("change", () => {
    sessionStorage.setItem(AUTO_KEY, String(auto.checked));
    schedule();
  });

  function schedule() {
    clearInterval(timer);
    timer = auto.checked ? setInterval(() => load(), AUTO_EVERY) : null;
  }

  async function load() {
    let scores;
    try {
      scores = await Promise.all(cfg.names.map(async name => ({ name, votes: await get(cfg.uuid + name) })));
    } catch {
      if (alive) {
        status.className = "notice notice--error";
        status.textContent = t("tour.loadError");
      }
      return;
    }
    if (!alive) return;
    scores.sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name, lang()));
    const totalVotes = scores.reduce((s, x) => s + x.votes, 0);

    status.className = "notice";
    status.textContent = totalVotes ? "" : t("tour.noVotes");
    status.hidden = totalVotes > 0;

    renderPodium(scores, totalVotes);
    renderRanking(scores);
    if (first && totalVotes) confetti();
    first = false;
  }

  function renderPodium(scores, totalVotes) {
    podium.classList.toggle("is-static", !first);
    if (!totalVotes) { podium.replaceChildren(); return; }
    const levels = [...new Set(scores.map(s => s.votes))].filter(v => v > 0).slice(0, 3);
    const groups = levels.map(v => scores.filter(s => s.votes === v));
    const order = [[1, "silver"], [0, "gold"], [2, "bronze"]];
    podium.replaceChildren(...order.map(([rank, metal], i) => {
      const group = groups[rank];
      return h("div", { class: `podium-step podium-step--${metal}${group ? "" : " is-empty"}`, style: { "--i": [1, 2, 0][i] } },
        h("p", { class: "podium-names" }, group ? group.map(g => g.name).join(", ") : ""),
        h("p", { class: "podium-votes" }, group ? votesLabel(group[0].votes) : ""),
        h("span", { class: "podium-rank", "aria-hidden": "true" }, String(rank + 1))
      );
    }));
  }

  function renderRanking(scores) {
    const max = Math.max(1, ...scores.map(s => s.votes));
    ranking.replaceChildren(...scores.map(s => h("li", null,
      h("span", { class: "ranking-name" }, s.name),
      h("span", { class: "ranking-bar", "aria-hidden": "true" }, h("span", { style: { width: `${(s.votes / max) * 100}%` } })),
      h("span", { class: "ranking-votes" }, votesLabel(s.votes))
    )));
  }

  const votesLabel = n => `${n.toLocaleString(lang())} ${t(n > 1 ? "tour.votes" : "tour.vote")}`;

  load();
  schedule();

  return () => { alive = false; clearInterval(timer); };
}

/* =========================================================
   Création d’un tournoi
   ========================================================= */

function openCreator() {
  const title = input({ placeholder: t("tour.fTitlePh"), maxlength: 60 });
  const list = h("ol", { class: "name-list" });
  const error = h("p", { class: "field-error", role: "alert" });
  const addBtn = button(t("tour.addName"), { variant: "ghost", icon: "plus", onclick: () => addRow(true) });

  function renumber() {
    const items = [...list.children];
    items.forEach((li, i) => {
      li.querySelector("input").setAttribute("aria-label", `${t("tour.fName")} ${i + 1}`);
      li.querySelector(".name-remove").hidden = items.length <= 2;
    });
    addBtn.disabled = items.length >= MAX_NAMES;
  }

  function addRow(focus) {
    if (list.children.length >= MAX_NAMES) return;
    const nameInput = input({ maxlength: 40, autocapitalize: "words", enterkeyhint: "next" });
    const li = h("li", { class: "name-row" },
      nameInput,
      h("button", {
        class: "icon-btn name-remove", type: "button", "aria-label": t("tour.remove"),
        onclick: () => { li.remove(); renumber(); }
      }, svg(ICONS.close))
    );
    nameInput.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const nextLi = li.nextElementSibling;
      if (nextLi) nextLi.querySelector("input").focus();
      else if (nameInput.value.trim()) addRow(true);
    });
    list.append(li);
    renumber();
    if (focus) nameInput.focus();
  }

  addRow(false);
  addRow(false);

  const createBtn = button(t("createLink"), { variant: "primary", onclick: submit });
  const sheet = openSheet({
    title: t("tour.name"),
    content: h("div", { class: "form" },
      field(t("tour.fTitle"), title),
      h("fieldset", { class: "field" }, h("legend", null, t("tour.names")), list, addBtn, error)
    ),
    actions: [
      button(t("cancel"), { variant: "ghost", onclick: () => sheet.close() }),
      createBtn
    ]
  });

  async function submit() {
    const seen = new Set();
    const names = [];
    list.querySelectorAll("input").forEach(el => {
      const n = el.value.trim().replace(/\s+/g, " ");
      const key = n.toLocaleLowerCase();
      if (n && !seen.has(key)) { seen.add(key); names.push(n); }
    });
    if (names.length < 2) {
      error.textContent = t("tour.atLeastTwo");
      return;
    }

    createBtn.disabled = true;
    const uuid = (crypto.randomUUID && crypto.randomUUID()) ||
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    await Promise.allSettled(names.map(n => set(uuid + n, 0)));

    const data = { k: "tour", t: valueOr(title), n: names, u: uuid };
    sheet.close(true);
    showLinks([
      { label: t("tour.playLink"), url: gameLink(ROUTE, data) },
      { label: t("tour.resultsLink"), url: gameLink(ROUTE, data, "&result=1") }
    ], data.t);
  }
}

/* Baby Roulette : machine à sous de la révélation du sexe (ancien genderReveal.html)
   Données du lien : { k: "slot", g: 1 garçon | 2 fille, t: titre, b: symbole garçon, f: symbole fille,
                       s: message de réussite, x: message d’échec } */

import { t } from "./i18n.js";
import {
  h, button, field, fieldset, input, valueOr, openSheet, showLinks,
  demoBanner, brokenNotice, madeWith, clearCreateFlag, reducedMotion, firstGrapheme, wait
} from "./ui.js";
import { readParams, gameLink } from "./share.js";
import { confetti } from "./effects.js";

const ROUTE = "gender-reveal";
const WIN_AT = 6;          // la bonne combinaison tombe au plus tard au 6e essai
const LIGHTS = 9;

function readConfig(params) {
  const { data, legacy, broken } = readParams(params);
  if (data && data.k === "slot") {
    return { shared: true, male: data.g !== 2, title: data.t, boy: data.b, girl: data.f, success: data.s, fail: data.x };
  }
  if (legacy && legacy.length >= 6) {
    const [g, title, boy, girl, success, ...fail] = legacy;
    return { shared: true, male: g === "1", title, boy, girl, success, fail: fail.join(";") };
  }
  if (data || legacy || broken) return { broken: true };
  return { shared: false };
}

export function mount(root, { params }) {
  const cfg = readConfig(params);
  const demo = !cfg.shared;
  const boy = cfg.boy || t("slot.boySymbol");
  const girl = cfg.girl || t("slot.girlSymbol");
  const male = demo ? true : cfg.male;
  const answer = male ? boy : girl;
  const wrong = male ? girl : boy;
  const title = cfg.title || t("slot.title");
  const success = cfg.success || t(male ? "slot.fSuccessPhBoy" : "slot.fSuccessPhGirl");
  const fail = cfg.fail || t("slot.fFailPh");
  document.title = title;

  let pulls = 0;
  let busy = false;
  let alive = true;

  /* -------------------------------------------- Interface */

  const reels = [0, 1, 2].map(() => {
    const strip = h("div", { class: "reel-strip" }, h("span", { class: "reel-item is-mystery" }, "?"));
    return { el: h("div", { class: "reel" }, strip), strip, current: "?" };
  });

  const result = h("p", { class: "slot-result", "aria-live": "polite" });

  const lever = h("button", { class: "lever", type: "button", "aria-label": t("slot.pull"), onclick: pull },
    h("span", { class: "lever-stick" }, h("span", { class: "lever-ball" }))
  );

  const machine = h("div", { class: "machine" },
    h("div", { class: "machine-lights", "aria-hidden": "true" },
      Array.from({ length: LIGHTS }, (_, i) => h("span", { style: { "--i": i } }))
    ),
    h("div", { class: "machine-window" }, reels.map(r => r.el)),
    h("div", { class: "machine-base", "aria-hidden": "true" }),
    lever
  );

  const pullBtn = button(t("slot.pull"), { variant: "primary", onclick: pull });
  pullBtn.classList.add("btn-lg");

  root.append(
    h("section", { class: "game game--slot" },
      cfg.broken ? brokenNotice() : null,
      h("h1", { class: "game-title" }, title),
      machine,
      pullBtn,
      result,
      demo ? demoBanner(openCreator) : madeWith()
    )
  );

  if (demo && params.has("create")) {
    clearCreateFlag(ROUTE);
    openCreator();
  }

  /* -------------------------------------------- Tirage */

  const draw = () => (Math.random() > 0.5 ? boy : girl);

  function outcome() {
    let r;
    do {
      r = [draw(), draw(), draw()];
    } while (r.filter(s => s === answer).length !== 3 && Math.random() > 0.3);

    if (!demo && pulls === WIN_AT) return [answer, answer, answer];

    const same = r[0] === r[1] && r[1] === r[2];
    // Jamais de gain en démo ni au premier essai, et jamais trois fois le mauvais symbole
    if (same && (demo || pulls === 1 || r[0] === wrong)) {
      const i = Math.floor(Math.random() * 3);
      r[i] = r[i] === boy ? girl : boy;
    }
    return r;
  }

  async function spinReel(reel, final, index) {
    const cell = reel.el.clientHeight;
    const quick = reducedMotion();
    const count = quick ? 1 : 12 + index * 5;
    const items = [reel.current, ...Array.from({ length: count }, draw), final];

    reel.strip.replaceChildren(...items.map(s => h("span", { class: "reel-item" }, s)));
    reel.strip.style.transition = "none";
    reel.strip.style.transform = "translateY(0)";
    void reel.strip.offsetHeight;

    const duration = quick ? 250 : 950 + index * 380;
    reel.strip.style.transition = `transform ${duration}ms cubic-bezier(.2, .8, .3, 1.06)`;
    reel.strip.style.transform = `translateY(${-(items.length - 1) * cell}px)`;
    await wait(duration + 40);

    reel.strip.style.transition = "none";
    reel.strip.style.transform = "translateY(0)";
    reel.strip.replaceChildren(h("span", { class: "reel-item" }, final));
    reel.current = final;
  }

  async function pull() {
    if (busy) return;
    busy = true;
    pulls++;
    pullBtn.disabled = true;
    machine.classList.remove("is-win");
    machine.classList.add("is-spinning");
    result.className = "slot-result";
    result.textContent = "";

    lever.classList.remove("is-pulled");
    void lever.offsetWidth;
    lever.classList.add("is-pulled");

    const r = outcome();
    await Promise.all(reels.map((reel, i) => spinReel(reel, r[i], i)));
    if (!alive) return;
    machine.classList.remove("is-spinning");

    const win = !demo && r.every(s => s === answer);
    if (win) {
      machine.classList.add("is-win");
      result.classList.add("is-win");
      result.textContent = success;
      confetti({ colors: male ? ["#4E9BFF", "#9CC8FF", "#FFC94A", "#FFFFFF"] : ["#FF6F9F", "#FFB3CB", "#FFC94A", "#FFFFFF"] });
    } else {
      result.textContent = demo ? t("slot.demoFail") : fail;
    }
    busy = false;
    pullBtn.disabled = false;
  }

  return () => { alive = false; };
}

/* -------------------------------------------- Création d’une machine */

function openCreator() {
  let gender = 1;

  const title = input({ placeholder: t("slot.fTitlePh"), maxlength: 60 });
  const boyIn = input({ class: "emoji-input", placeholder: t("slot.boySymbol"), maxlength: 16 });
  const girlIn = input({ class: "emoji-input", placeholder: t("slot.girlSymbol"), maxlength: 16 });
  const success = input({ placeholder: t("slot.fSuccessPhBoy"), maxlength: 120 });
  const fail = input({ placeholder: t("slot.fFailPh"), maxlength: 120 });
  const error = h("p", { class: "field-error", role: "alert" });

  const genders = h("div", { class: "segmented" },
    [[1, t("slot.boy"), "blue"], [2, t("slot.girl"), "pink"]].map(([g, label, color]) =>
      h("label", { class: `segmented-opt segmented-opt--${color}` },
        h("input", {
          type: "radio", name: "slot-gender", value: g, checked: g === 1,
          onchange: () => {
            gender = g;
            success.placeholder = t(g === 1 ? "slot.fSuccessPhBoy" : "slot.fSuccessPhGirl");
          }
        }),
        h("span", null, label)
      )
    )
  );

  const symbols = h("div", { class: "emoji-pair" },
    h("label", { class: "emoji-field" }, boyIn, h("span", null, t("slot.boy"))),
    h("label", { class: "emoji-field" }, girlIn, h("span", null, t("slot.girl")))
  );

  const sheet = openSheet({
    title: t("slot.name"),
    content: h("div", { class: "form" },
      field(t("slot.fTitle"), title),
      fieldset(t("slot.fGender"), genders),
      fieldset(t("slot.fSymbols"), symbols),
      field(t("slot.fSuccess"), success),
      field(t("slot.fFail"), fail),
      error
    ),
    actions: [
      button(t("cancel"), { variant: "ghost", onclick: () => sheet.close() }),
      button(t("createLink"), { variant: "primary", onclick: submit })
    ]
  });

  function submit() {
    const b = firstGrapheme(boyIn.value) || t("slot.boySymbol");
    const f = firstGrapheme(girlIn.value) || t("slot.girlSymbol");
    if (b === f) {
      error.textContent = t("slot.sameSymbols");
      girlIn.focus();
      return;
    }
    const data = { k: "slot", g: gender, t: valueOr(title), b, f, s: valueOr(success), x: valueOr(fail) };
    sheet.close(true);
    showLinks([{ url: gameLink(ROUTE, data) }], data.t);
  }
}

/* Baby Roulette : compteurs (vues des pages, votes du tournoi) via countapi.mileshilliard.com.
   Les clés sont les mêmes que dans la première version : les chiffres déjà comptés sont conservés. */

const API = "https://countapi.mileshilliard.com/api/v1/";
const VIEWS = "babyrouletteviews";

async function call(path) {
  const res = await fetch(API + path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const key = id => encodeURIComponent(id);

export const hit = id => call(`hit/${key(id)}`);

export async function get(id) {
  const data = await call(`get/${key(id)}`);
  return Number(data?.value) || 0;
}

export const set = (id, value) => call(`set/${key(id)}?value=${Number(value) || 0}`);

// Une vue pour la page, une vue pour le total. Les erreurs réseau sont ignorées.
export function addView(page) {
  if (page) hit(VIEWS + page).catch(() => {});
  hit(VIEWS).catch(() => {});
}

export const getViews = page => get(VIEWS + (page || ""));

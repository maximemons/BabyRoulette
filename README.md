# Baby Roulette

Des petits jeux à partager pour révéler le sexe ou le prénom de bébé à ses proches. On personnalise un jeu, on envoie le lien, la famille joue sur son téléphone.

Site : [www.baby-roulette.com](https://www.baby-roulette.com)

## Les jeux

### Bandit manchot (révélation du sexe)

- Une machine à sous à trois rouleaux et un levier.
- Le créateur choisit le sexe, deux symboles (♂️ / ♀️ par défaut, n’importe quel emoji), un titre, un message de réussite et un message d’échec.
- Jamais de gain au premier essai, jamais trois fois le mauvais symbole, et la bonne combinaison tombe au plus tard au 6ᵉ essai.
- En démo, la machine ne donne jamais la réponse.

### Motus (révélation du prénom)

- Six essais pour deviner le prénom ; la première lettre est donnée.
- Accents ignorés (Élodie = ELODIE). Tirets, espaces et apostrophes sont affichés d’office.
- Les lettres bien placées restent acquises d’une ligne à l’autre. Les lettres doublées sont comptées correctement.
- Clavier à l’écran AZERTY ou QWERTY (choix mémorisé) et clavier physique.
- Après un échec, le créateur peut choisir de révéler le prénom quand même.

### Tournoi de prénoms

- Duels entre prénoms jusqu’au choix final ; avec un nombre impair, un prénom passe directement au tour suivant.
- Chaque tournoi terminé ajoute un vote au prénom gagnant.
- Le créateur reçoit deux liens : un pour jouer, un pour suivre les résultats (podium, classement, actualisation toutes les 30 s).

## Langues

Français, anglais, espagnol, allemand, italien, portugais et néerlandais. La langue du navigateur est utilisée par défaut ; le choix fait dans l’en-tête est mémorisé.

## Les liens partagés

Toute la configuration d’un jeu tient dans le lien : aucun compte, aucune base de données.

- Nouveau format : `#/<jeu>?d=<JSON en base64url>`.
- Ancien format (première version) : `genderReveal.html?q=…`, `wordle.html?q=…`, `nameTournament.html?q=…&result=true`. Ces adresses n’existent plus comme fichiers ; GitHub Pages sert alors `404.html`, qui redirige vers la nouvelle appli en gardant les données. Les anciens liens envoyés continuent donc de fonctionner.

| Jeu | Route | Données (`d`) |
|---|---|---|
| Bandit manchot | `#/gender-reveal` | `k: "slot"`, `g` (1 garçon, 2 fille), `t` titre, `b` / `f` symboles, `s` réussite, `x` échec |
| Motus | `#/name-reveal` | `k: "wordle"`, `n` prénom, `t`, `s`, `x`, `a` révélation après échec |
| Tournoi | `#/name-tournament` | `k: "tour"`, `t`, `n` liste des prénoms, `u` identifiant des votes ; `&result=1` pour les résultats |

Sans paramètre, chaque jeu s’ouvre en démo. `?create=1` ouvre directement le formulaire de création.

## Compteurs

Les vues des pages et les votes du tournoi passent par [countapi.mileshilliard.com](https://countapi.mileshilliard.com), avec les mêmes clés que la première version (les chiffres déjà comptés sont conservés) :

```
babyrouletteviews                  vues au total
babyrouletteviews<page>            vues par page (index, genderreveal, wordle, nametournament, about)
<identifiant du tournoi><prénom>   votes d’un prénom
```

Les statistiques sont visibles sur `#/about`.

## Héberger

Fichiers statiques, aucune compilation. Le dépôt se publie tel quel avec GitHub Pages (le fichier `CNAME` porte le domaine personnalisé). En local :

```bash
python3 -m http.server 8000
```

Le service worker (`sw.js`) garde une copie de l’appli pour l’ouvrir hors ligne ; il n’est actif qu’en HTTPS. Après une mise à jour importante, changer `CACHE` dans `sw.js`.

## Structure

```
index.html            page unique, navigation par #/…
404.html              redirection des anciennes adresses et des pages inconnues
css/style.css
js/app.js             navigation, en-tête, accueil, à propos, page introuvable
js/i18n.js            textes de l’interface (7 langues) et prénoms des démos
js/ui.js              éléments, fenêtres, champs, liens à partager, toasts
js/share.js           encodage et lecture des liens (nouveau et ancien format)
js/counter.js         compteurs de vues et de votes
js/effects.js         confettis et petit nuage
js/slot.js            bandit manchot
js/wordle.js          Motus
js/tournament.js      tournoi de prénoms
sw.js                 service worker : cache hors ligne
manifest.webmanifest  installation sur l’écran d’accueil
favicon.svg, favicon.ico, icons/
CNAME                 domaine personnalisé GitHub Pages
```

## Soutenir

[Soutenir via PayPal](https://www.paypal.com/donate/?hosted_button_id=MBLHARVDYVX2S)

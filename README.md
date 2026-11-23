# Schéma 3D : maison et terrain voisin

Application web en 3D, faite pour le téléphone. Elle explique la situation entre une maison ancienne et le terrain rehaussé de la maison voisine : constructions, végétation, limite de propriété et parcours possible de l'eau jusque sous la maison.

## Ce que montre l'application

- **Vue d'ensemble** : la scène, avec 15 repères numérotés. Toucher un repère ouvre sa fiche. Quatre calques peuvent être masqués : constructions des voisins, végétation des voisins, maison ancienne, limite et eau.
- **Quand il pleut** : le parcours possible de l'eau de pluie, en 7 étapes.
- **Sous la maison** : une coupe sous la maison, avec le parcours possible de l'eau en 10 étapes (A à J).
- **Vérifications de l'expert** : 6 points à faire vérifier, avec des cases à cocher gardées sur l'appareil.
- **À propos** : les mentions, les sources et la date de la version.

Sans 3D (navigateur trop ancien), l'application montre la vue d'ensemble en image. La légende et les fiches restent lisibles en texte.

## L'ouvrir sur un téléphone

Ouvrir le lien de l'application dans Safari (iPhone) ou Chrome (Android). Aucune installation n'est nécessaire.

- Un doigt : tourner autour de la scène.
- Deux doigts : pincer pour zoomer, glisser pour déplacer.
- « Recentrer la vue » : revenir au cadrage de départ.

## L'ajouter à l'écran d'accueil

- **iPhone** : dans Safari, toucher Partager, puis « Sur l'écran d'accueil ».
- **Android** : dans Chrome, toucher le menu ⋮, puis « Installer l'application ».

L'application fonctionne ensuite aussi sans connexion.

## Mentions

- Schéma explicatif, non à l'échelle, d'après les plans de 1991 et 2015 et les indications de la propriétaire.
- Ce schéma ne prouve ni la position exacte de la limite, ni la cause des dégâts : c'est le rôle de l'expert.
- Ce n'est pas un plan. Pour le tribunal : plans authentiques, constat d'huissier et rapport d'expertise.
- Ce schéma ne remplace pas l'avis d'un avocat ni le rapport d'un expert.

## Pour les développeurs

Vite, React, TypeScript, three.js (React Three Fiber). La géométrie et les textes viennent de `docs/scene-spec.json`.

```sh
npm ci
npm run dev        # serveur local
npm run test       # tests
npm run build      # construction dans dist/
```

La publication sur GitHub Pages se fait à chaque envoi sur `main` (`.github/workflows/deploy.yml`).

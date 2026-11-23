import { useEffect, useRef } from 'react'
import { scene } from '../data/scene'

/** Les trois mentions obligatoires de la spécification. */
export function Mentions() {
  return (
    <ul className="mentions">
      {scene.mentions_obligatoires.map((m) => (
        <li key={m}>{m}</li>
      ))}
    </ul>
  )
}

// Écran d'accueil au premier lancement : titre, une phrase, les mentions, « Voir la maison ».
export function Disclaimer({ fermer }: { fermer: () => void }) {
  const bouton = useRef<HTMLButtonElement>(null)
  useEffect(() => bouton.current?.focus(), [])
  return (
    <div className="ecran" role="dialog" aria-modal="true" aria-labelledby="accueil-titre">
      <div className="ecran-page">
        <h1 id="accueil-titre">Maison de Paula et terrain voisin</h1>
        <p className="ecran-intro">
          Ce schéma en 3D montre la maison de Paula, le terrain rehaussé des voisins, la limite de
          propriété et le parcours possible de l'eau jusque sous la maison.
        </p>
        <Mentions />
        <button ref={bouton} type="button" className="bouton-principal" onClick={fermer}>
          Voir la maison
        </button>
      </div>
    </div>
  )
}

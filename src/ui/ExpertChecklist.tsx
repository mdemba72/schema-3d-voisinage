import { useState } from 'react'
import { ecrireCoches, lireCoches, VERIFS, ZONES } from '../lib/expert'
import { useStore } from '../store'

// Mode « Vérifications de l'expert » : 6 points à cocher, mémorisés sur l'appareil.
// Toucher un point cadre la scène sur sa zone.
export function ExpertChecklist() {
  const [coches, setCoches] = useState<number[]>(lireCoches)
  const verif = useStore((s) => s.verif)
  const choisir = useStore((s) => s.choisirVerif)

  const changer = (suivantes: number[]) => {
    setCoches(suivantes)
    ecrireCoches(suivantes)
  }
  const basculer = (i: number) =>
    changer(coches.includes(i) ? coches.filter((n) => n !== i) : [...coches, i])

  return (
    <div className="expert">
      <p className="avertissement">
        Points à faire vérifier par l'expert. Les coches restent sur cet appareil.
      </p>
      <ul className="verifs">
        {VERIFS.map((texte, i) => {
          const coche = coches.includes(i)
          return (
            <li key={texte} className="verif" data-coche={coche} data-choisi={verif === i}>
              <input
                type="checkbox"
                className="verif-case"
                checked={coche}
                onChange={() => basculer(i)}
                aria-label={`Vérifié : ${texte}`}
              />
              <button
                type="button"
                className="verif-texte"
                aria-pressed={verif === i}
                onClick={() => choisir(verif === i ? null : i)}
              >
                <span>{texte}</span>
                <span className="verif-zone">Voir {ZONES[i]}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="verifs-pied">
        <p aria-live="polite">
          {coches.length} sur {VERIFS.length} vérifiés
        </p>
        <button
          type="button"
          className="bouton-texte"
          disabled={coches.length === 0}
          onClick={() => changer([])}
        >
          Tout décocher
        </button>
      </div>
    </div>
  )
}

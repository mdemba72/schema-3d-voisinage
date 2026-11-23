import { scene, type Element } from '../data/scene'
import { CALQUES, calqueDe, useStore, type Calque } from '../store'
import { Pastille } from './Pastille'

/** Note de bas de groupe, tirée de la spécification. */
const NOTES: Partial<Record<Calque, string[]>> = {
  vegetation: [scene.legende_eau.racines],
  limite_eau: [scene.legende_eau.convention],
}

function Ligne({ el, actif }: { el: Element; actif: boolean }) {
  const selectionner = useStore((s) => s.selectionner)
  return (
    <li>
      <button
        type="button"
        className="legende-ligne"
        disabled={!actif}
        onClick={() => selectionner(el.id)}
      >
        <Pastille el={el} petite />
        <span>{el.nom}</span>
      </button>
    </li>
  )
}

// Légende complète en 4 groupes, hors du canvas. Chaque groupe a son interrupteur de calque ;
// chaque ligne sélectionne le repère.
export function Legend() {
  const calques = useStore((s) => s.calques)
  const basculer = useStore((s) => s.basculerCalque)
  return (
    <div className="legende">
      {CALQUES.map((c) => {
        const actif = calques[c.id]
        const elements = scene.elements.filter((e) => calqueDe(e.groupe) === c.id)
        return (
          <section key={c.id} className="legende-groupe" data-actif={actif}>
            <div className="legende-tete">
              <h3 id={`calque-${c.id}`}>{c.nom}</h3>
              <button
                type="button"
                role="switch"
                className="interrupteur"
                aria-checked={actif}
                aria-labelledby={`calque-${c.id}`}
                onClick={() => basculer(c.id)}
              >
                <span className="interrupteur-texte">{actif ? 'Affiché' : 'Masqué'}</span>
              </button>
            </div>
            <ul>
              {elements.map((el) => (
                <Ligne key={el.id} el={el} actif={actif} />
              ))}
            </ul>
            {NOTES[c.id]?.map((n) => (
              <p key={n} className="legende-note">
                {n}
              </p>
            ))}
          </section>
        )
      })}
    </div>
  )
}

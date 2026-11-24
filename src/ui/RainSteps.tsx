import { scene } from '../data/scene'
import { useStore } from '../store'
import { StepScrubber } from './StepScrubber'

const etapes = scene.parcours_pluie_7_etapes

/**
 * Notes de la spécification rattachées à certaines étapes. L'étape 1 dit déjà « À vérifier »
 * pour la destination des gouttières ; elle ajoute la question du raccordement (a_verifier_affiche[2]).
 */
const NOTES: Record<number, string[]> = {
  1: [scene.a_verifier_affiche[2]!],
  4: [
    `${scene.ancien_ecoulement.mention[0]!.toUpperCase()}${scene.ancien_ecoulement.mention.slice(1)}.`,
    scene.legende_eau.convention,
  ],
  6: [scene.a_verifier_affiche[0]!],
}

// Mode « Quand il pleut » : une étape à la fois.
export function RainSteps() {
  const n = useStore((s) => s.etapePluie)
  const choisir = useStore((s) => s.choisirEtapePluie)
  const etape = etapes.find((e) => e.n === n)!
  return (
    <div className="pluie">
      <p className="avertissement">Parcours possible de l'eau, à vérifier par l'expert.</p>
      <StepScrubber
        libelle="Étapes de la pluie"
        reperes={etapes.map((e) => String(e.n))}
        noms={etapes.map((e) => e.titre)}
        courant={n - 1}
        choisir={(i) => choisir(i + 1)}
      />
      <article className="fiche" aria-live="polite">
        <h3>{etape.titre}</h3>
        <p className="fiche-texte">{etape.texte}</p>
        {NOTES[n]?.map((t) => (
          <p key={t} className="legende-note">
            {t}
          </p>
        ))}
      </article>
    </div>
  )
}

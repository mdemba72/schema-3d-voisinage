interface Props {
  /** Repère affiché de chaque étape (« 1 », « A »…). */
  reperes: string[]
  /** Nom de chaque étape, pour les lecteurs d'écran. */
  noms: string[]
  /** Index courant (0 = première étape). */
  courant: number
  choisir: (index: number) => void
  libelle: string
  /** Lecture automatique (facultative) : bouton Lire / Pause. */
  lecture?: { active: boolean; basculer: () => void }
}

// Indicateur d'étapes cliquable et boutons « Précédente » / « Suivante ».
export function StepScrubber({ reperes, noms, courant, choisir, libelle, lecture }: Props) {
  const dernier = reperes.length - 1
  return (
    <div className="etapes">
      <ol className="etapes-liste" aria-label={libelle}>
        {reperes.map((r, i) => (
          <li key={r}>
            <button
              type="button"
              className="etape-point"
              aria-current={i === courant ? 'step' : undefined}
              aria-label={`Étape ${r} : ${noms[i]}`}
              onClick={() => choisir(i)}
            >
              {r}
            </button>
          </li>
        ))}
      </ol>
      <div className="etapes-nav">
        {lecture && (
          <button
            type="button"
            className="bouton-secondaire"
            aria-pressed={lecture.active}
            onClick={lecture.basculer}
          >
            {lecture.active ? 'Pause' : 'Lire'}
          </button>
        )}
        <button
          type="button"
          className="bouton-secondaire"
          disabled={courant === 0}
          onClick={() => choisir(courant - 1)}
        >
          Précédente
        </button>
        <button
          type="button"
          className="bouton-secondaire"
          disabled={courant === dernier}
          onClick={() => choisir(courant + 1)}
        >
          Suivante
        </button>
      </div>
    </div>
  )
}

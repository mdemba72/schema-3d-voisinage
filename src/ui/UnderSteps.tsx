import { useEffect } from 'react'
import { scene } from '../data/scene'
import { ETAPES_SOUS } from '../lib/sousSol'
import { useStore } from '../store'
import { StepScrubber } from './StepScrubber'

/** Durée d'affichage d'une étape en lecture automatique (ms). */
const DUREE_LECTURE = 4500

/** Notes rattachées à certaines étapes (élargissement, positions à vérifier). */
const NOTES: Record<string, string[]> = {
  D: ["L'espace d'environ 3 cm est élargi sur le schéma pour rester visible."],
  E: ["Point d'interrogation : zone que personne n'a encore vue."],
  G: ["Point d'interrogation : zone que personne n'a encore vue."],
  H: [scene.a_verifier_affiche[0]!],
  I: [
    scene.a_verifier_affiche[0]!,
    'Un WC au rez-de-chaussée, un à l’étage, sur une descente commune : positions indicatives.',
  ],
}

// Mode « Sous la maison » : étapes A à J, une à la fois, avec lecture automatique.
export function UnderSteps() {
  const i = useStore((s) => s.etapeSous)
  const choisir = useStore((s) => s.choisirEtapeSous)
  const lecture = useStore((s) => s.lecture)
  const lire = useStore((s) => s.lire)
  const etape = ETAPES_SOUS[i]!
  const dernier = ETAPES_SOUS.length - 1

  // Lecture automatique : étape suivante après un temps, arrêt à la dernière.
  useEffect(() => {
    if (!lecture) return
    const t = window.setTimeout(() => {
      if (i >= dernier) lire(false)
      else choisir(i + 1)
    }, DUREE_LECTURE)
    return () => window.clearTimeout(t)
  }, [lecture, i, dernier, choisir, lire])

  return (
    <div className="pluie">
      <StepScrubber
        libelle="Étapes du parcours sous la maison"
        reperes={ETAPES_SOUS.map((e) => e.etape)}
        noms={ETAPES_SOUS.map((e) => e.texte)}
        courant={i}
        choisir={(k) => {
          lire(false)
          choisir(k)
        }}
        lecture={{
          active: lecture,
          basculer: () => {
            // Relancer depuis A quand la lecture est arrivée au bout.
            if (!lecture && i === dernier) choisir(0)
            lire(!lecture)
          },
        }}
      />
      <article className="fiche" aria-live={lecture ? 'off' : 'polite'}>
        <h3>
          <span className="lettre-etape" data-couleur={etape.couleur} aria-hidden="true">
            {etape.etape}
          </span>
          Étape {etape.etape}
        </h3>
        <p className="fiche-texte">{etape.texte}</p>
        {NOTES[etape.etape]?.map((t) => (
          <p key={t} className="legende-note">
            {t}
          </p>
        ))}
        <p className="legende-note">{scene.legende_eau.convention}</p>
      </article>
    </div>
  )
}

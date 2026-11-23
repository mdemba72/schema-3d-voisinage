import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ecrire, lire } from './lib/stockage'
import { useStore } from './store'
import { About } from './ui/About'
import { BottomSheet } from './ui/BottomSheet'
import { Disclaimer } from './ui/Disclaimer'
import { GardeScene, Repli2D } from './ui/Repli2D'
import { webglDisponible } from './lib/webgl'
import { ModeSwitch } from './ui/ModeSwitch'

const CLE_ACCUEIL = 'schema3d.accueil'

// La scène 3D (three.js) est chargée à part : l'en-tête, le panneau et l'accueil s'affichent d'abord.
// Pendant l'accueil (premier lancement), la scène n'est que préchargée : elle est construite
// quand l'accueil se ferme, pour laisser le téléphone libre pendant la lecture.
const chargerScene = () => import('./scene/Scene3D')
const Scene3D = lazy(() => chargerScene().then((m) => ({ default: m.Scene3D })))
const PRECHARGEMENT_MS = 1500

function ChargementScene() {
  return (
    <p className="chargement" role="status">
      Chargement du schéma…
    </p>
  )
}

/** En-tête : titre court, « À propos », sélecteur de mode. Sa hauteur est retirée de la scène. */
function Entete() {
  const ref = useRef<HTMLElement>(null)
  const fixerMarges = useStore((s) => s.fixerMarges)
  const ouvrirAPropos = useStore((s) => s.ouvrirAPropos)
  const recentrer = useStore((s) => s.recentrer)
  const sous = useStore((s) => s.mode === 'sous')
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const mesurer = () => fixerMarges({ haut: Math.round(el.getBoundingClientRect().bottom) })
    mesurer()
    const ro = new ResizeObserver(mesurer)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fixerMarges])
  return (
    <header ref={ref} className="entete">
      <div className="entete-ligne">
        <h1>Maison de Paula</h1>
        <button type="button" className="bouton-texte" onClick={() => ouvrirAPropos(true)}>
          À propos
        </button>
      </div>
      <ModeSwitch />
      {sous && (
        <p className="mention-mode">
          Parcours possible, à vérifier par l'expert. Personne n'a encore vu ce qui se passe sous la
          maison.
        </p>
      )}
      <button type="button" className="recentrer" onClick={recentrer}>
        Recentrer la vue
      </button>
    </header>
  )
}

export default function App() {
  const [accueil, setAccueil] = useState(() => lire(CLE_ACCUEIL) !== 'vu')
  const aPropos = useStore((s) => s.aProposOuvert)
  const [avec3D] = useState(webglDisponible)
  useEffect(() => {
    if (!accueil || !avec3D) return
    const t = window.setTimeout(() => void chargerScene(), PRECHARGEMENT_MS)
    return () => window.clearTimeout(t)
  }, [accueil, avec3D])
  const fermerAccueil = () => {
    ecrire(CLE_ACCUEIL, 'vu')
    setAccueil(false)
  }
  return (
    <>
      {/* Le schéma est rendu inerte sous l'accueil et « À propos » (React 18 : attribut en chaîne). */}
      <div
        className={avec3D ? 'app' : 'app sans-3d'}
        {...((accueil || aPropos) && ({ inert: '' } as object))}
      >
        <main
          className="zone-scene"
          aria-label="Schéma 3D de la maison de Paula et du terrain voisin"
        >
          {avec3D ? (
            <GardeScene>
              <Suspense fallback={<ChargementScene />}>
                {accueil ? <ChargementScene /> : <Scene3D />}
              </Suspense>
            </GardeScene>
          ) : (
            <Repli2D />
          )}
          <Entete />
        </main>
        <BottomSheet />
      </div>
      {accueil && <Disclaimer fermer={fermerAccueil} />}
      {aPropos && <About />}
    </>
  )
}

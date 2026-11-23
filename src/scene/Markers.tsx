import { Html } from '@react-three/drei'
import { scene, type Element } from '../data/scene'
import { toThree } from '../lib/coords'
import { tonPastille } from '../lib/pastille'
import { useCalqueVisible, useStore } from '../store'

function Pastille({ el }: { el: Element }) {
  const visible = useCalqueVisible(el.groupe)
  const choisi = useStore((s) => s.selection === el.id)
  const selectionner = useStore((s) => s.selectionner)
  if (!visible) return null
  return (
    <Html position={toThree(el.ancre)} center zIndexRange={[20, 0]}>
      <button
        type="button"
        className="pastille"
        data-ton={tonPastille(el)}
        aria-pressed={choisi}
        aria-label={`Repère ${el.id} : ${el.nom}`}
        onClick={() => selectionner(choisi ? null : el.id)}
      >
        {el.id}
      </button>
    </Html>
  )
}

// Les 15 repères, à taille fixe à l'écran, jamais masqués par la géométrie (occlude désactivé).
export function Markers() {
  // Les repères appartiennent à la vue d'ensemble.
  const mode = useStore((s) => s.mode)
  if (mode !== 'vue') return null
  return (
    <group>
      {scene.elements.map((el) => (
        <Pastille key={el.id} el={el} />
      ))}
    </group>
  )
}

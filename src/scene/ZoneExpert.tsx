import { Html, Line } from '@react-three/drei'
import { palette, scene } from '../data/scene'
import { toThree } from '../lib/coords'
import { repereVerif, ZONES } from '../lib/expert'
import { useStore } from '../store'

// Mode « Vérifications de l'expert » : étiquette de la zone choisie. Le regard est enterré :
// son emprise est tracée au sol en pointillés (convention « dans le sol, supposé »).
export function ZoneExpert() {
  const mode = useStore((s) => s.mode)
  const verif = useStore((s) => s.verif)
  if (mode !== 'expert' || verif === null) return null
  const { centre, cote } = scene.sous_sol.regard
  const [cx, cy] = centre
  const r = cote / 2
  const contour = [
    [cx - r, cy - r],
    [cx + r, cy - r],
    [cx + r, cy + r],
    [cx - r, cy + r],
    [cx - r, cy - r],
  ].map(([x, y]) => toThree([x!, y!, 0.04]))
  return (
    <group>
      {verif === 0 && (
        <Line
          points={contour}
          color={palette.encre}
          lineWidth={2.5}
          dashed
          dashSize={0.18}
          gapSize={0.12}
        />
      )}
      <Html position={toThree(repereVerif(verif))} center zIndexRange={[20, 0]}>
        <span className="etiquette-scene etiquette-zone">
          {verif === 0 ? 'le regard, sous le sol (position à vérifier)' : ZONES[verif]}
        </span>
      </Html>
    </group>
  )
}

import { elementsDeType, palette } from '../data/scene'
import { useCalqueVisible, useStore } from '../store'
import { Calque, Mat } from './materiaux'

// Bambous du petit jardin à l'arrière de la maison de Paula (sans numéro de repère).
// Toucher les bambous, en vue d'ensemble, ouvre leur fiche.
// Réglages visuels : tiges fines, feuillage en fuseau.
const TIGES = [
  [0, 0, 0],
  [0.18, 0.1, 0.06],
  [-0.12, 0.16, -0.05],
] as const
const RAYON_TIGE = 0.035

export function Bambous() {
  const mode = useStore((s) => s.mode)
  const selectionner = useStore((s) => s.selectionner)
  const el = elementsDeType('bambous')[0]
  // Calque masqué : les bambous ne répondent plus au toucher.
  const visible = useCalqueVisible(el?.groupe ?? 'paula')
  if (!el) return null
  const h = el.hauteur
  const toucher = (e: { stopPropagation: () => void }) => {
    if (mode !== 'vue' || !visible) return
    e.stopPropagation()
    selectionner(el.id)
  }
  return (
    <Calque groupe={el.groupe}>
      <group onClick={toucher}>
        {el.positions.map(([x, y]) => (
          <group key={`${x}-${y}`} position={[x, 0, y]}>
            {TIGES.map(([dx, dz, penche], k) => (
              <mesh key={k} position={[dx, h * 0.45, dz]} rotation={[penche, 0, penche]}>
                <cylinderGeometry args={[RAYON_TIGE, RAYON_TIGE * 1.3, h * 0.9, 6]} />
                <Mat couleur={palette.vert_fonce} />
              </mesh>
            ))}
            <mesh position={[0, h * 0.62, 0]} scale={[0.55, h * 0.38, 0.55]}>
              <icosahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color={palette.haie} roughness={0.9} flatShading />
            </mesh>
          </group>
        ))}
      </group>
    </Calque>
  )
}

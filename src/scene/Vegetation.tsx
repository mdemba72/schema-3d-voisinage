import { BackSide } from 'three'
import { Instance, Instances } from '@react-three/drei'
import {
  elementParId,
  palette,
  type ElementArbre,
  type ElementArbres,
  type ElementHaies,
} from '../data/scene'
import { useStore } from '../store'
import { Calque } from './materiaux'
import { RUGOSITE } from './reglages'

// Réglages visuels (pas des données) : tronc fin, houppier aplati.
const RAYON_TRONC = 0.12
const APLATI = 0.8
const PAS_HAIE = 0.7

interface Arbre {
  repere: number
  cle: string
  x: number
  y: number
  z0: number
  hauteur: number
  rayon: number
  couleur: string
}

function arbres(): Arbre[] {
  const rangee = elementParId(7) as ElementArbres
  const gros = elementParId(8) as ElementArbre
  const voirie = elementParId(10) as ElementArbres
  const depuis = (el: ElementArbres) =>
    el.positions.map(([x, y]) => ({
      repere: el.id,
      cle: `${el.id}-${x}-${y}`,
      x,
      y,
      z0: el.z0,
      hauteur: el.hauteur,
      rayon: el.rayon_houppier,
      couleur: palette.vert,
    }))
  return [
    ...depuis(rangee),
    ...depuis(voirie),
    {
      repere: gros.id,
      cle: '8',
      x: gros.position[0],
      y: gros.position[1],
      z0: gros.z0,
      hauteur: gros.hauteur,
      rayon: gros.rayon_houppier,
      couleur: gros.couleur,
    },
  ]
}

function boulesHaie() {
  const haie = elementParId(9) as ElementHaies
  const r = haie.epaisseur / 2
  return haie.segments.flatMap((s, k) => {
    const dx = s.a[0] - s.de[0]
    const dy = s.a[1] - s.de[1]
    const n = Math.max(2, Math.ceil(Math.hypot(dx, dy) / PAS_HAIE) + 1)
    return Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1)
      return {
        cle: `${k}-${i}`,
        position: [s.de[0] + t * dx, s.z0 + haie.hauteur / 2, s.de[1] + t * dy] as const,
        echelle: [r * 1.15, haie.hauteur / 2, r * 1.15] as const,
        couleur: i % 2 ? palette.haie : palette.vert_fonce,
      }
    })
  })
}

// Repères 7, 8 et 10 : arbres (tronc + houppier en icosaèdre aplati, instanciés).
// Repère 9 : haies (rangées d'ellipsoïdes instanciés).
/** Contour de mise en évidence : coque légèrement agrandie, faces arrière à l'encre. */
function Coque({
  position,
  echelle,
}: {
  position: readonly [number, number, number]
  echelle: readonly [number, number, number]
}) {
  const k = 1.1
  return (
    <mesh position={position} scale={[echelle[0] * k, echelle[1] * k, echelle[2] * k]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial color={palette.encre} side={BackSide} />
    </mesh>
  )
}

export function Vegetation() {
  const liste = arbres()
  const boules = boulesHaie()
  const selection = useStore((s) => s.selection)
  const haie = elementParId(9)
  return (
    <Calque groupe="vegetation">
      {liste
        .filter((a) => a.repere === selection)
        .map((a) => (
          <Coque
            key={a.cle}
            position={[a.x, a.z0 + a.hauteur - a.rayon * APLATI, a.y]}
            echelle={[a.rayon, a.rayon * APLATI, a.rayon]}
          />
        ))}
      {selection === haie.id &&
        boules.map((b) => <Coque key={b.cle} position={b.position} echelle={b.echelle} />)}
      <Instances limit={liste.length}>
        <cylinderGeometry args={[RAYON_TRONC, RAYON_TRONC * 1.4, 1, 6]} />
        <meshStandardMaterial color={palette.terre_fonce} roughness={RUGOSITE} />
        {liste.map((a) => {
          const hTronc = a.hauteur - a.rayon * APLATI
          return (
            <Instance key={a.cle} position={[a.x, a.z0 + hTronc / 2, a.y]} scale={[1, hTronc, 1]} />
          )
        })}
      </Instances>
      <Instances limit={liste.length}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={RUGOSITE} flatShading />
        {liste.map((a) => (
          <Instance
            key={a.cle}
            color={a.couleur}
            position={[a.x, a.z0 + a.hauteur - a.rayon * APLATI, a.y]}
            scale={[a.rayon, a.rayon * APLATI, a.rayon]}
          />
        ))}
      </Instances>
      <Instances limit={boules.length}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial roughness={RUGOSITE} flatShading />
        {boules.map((b) => (
          <Instance key={b.cle} color={b.couleur} position={b.position} scale={b.echelle} />
        ))}
      </Instances>
    </Calque>
  )
}

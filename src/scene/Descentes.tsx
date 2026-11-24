import { elementParId, palette, scene, type ElementMaison, type Point2 } from '../data/scene'
import { Calque, Mat } from './materiaux'

// Descentes de gouttière (positions indicatives, à vérifier) : environ 3 sur la maison voisine,
// 2 sur la maison de Paula. Tubes verticaux de l'égout du toit jusqu'au sol.
function Tubes({ points, z0, z1 }: { points: Point2[]; z0: number; z1: number }) {
  const r = scene.descentes_gouttieres.rayon
  return (
    <>
      {points.map(([x, y]) => (
        <mesh key={`${x}-${y}`} position={[x, (z0 + z1) / 2, y]}>
          <cylinderGeometry args={[r, r, z1 - z0, 8]} />
          <Mat couleur={palette.attenue} />
        </mesh>
      ))}
    </>
  )
}

export function Descentes() {
  const d = scene.descentes_gouttieres
  const voisine = elementParId(1) as ElementMaison
  const paula = elementParId(11) as ElementMaison
  return (
    <>
      <Calque groupe={voisine.groupe}>
        <Tubes points={d.voisine} z0={voisine.z0} z1={voisine.z0 + voisine.hauteur_murs} />
      </Calque>
      <Calque groupe={paula.groupe}>
        <Tubes points={d.paula} z0={paula.z0} z1={paula.z0 + paula.hauteur_murs} />
      </Calque>
    </>
  )
}

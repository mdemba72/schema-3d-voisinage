import { elementParId, palette, type ElementMur, type ElementRondins } from '../data/scene'
import { Aretes, Calque, Mat } from './materiaux'

// Repère 2 : mur en béton des voisins, polyligne extrudée (une boîte par segment,
// prolongée d'une demi-épaisseur pour fermer les angles).
// Repère 13 : rondins en béton, à droite de l'annexe.
export function Wall() {
  const mur = elementParId(2) as ElementMur
  const rondins = elementParId(13) as ElementRondins

  const segments = mur.points.slice(1).map((b, i) => {
    const a = mur.points[i]!
    const dx = b[0] - a[0]
    const dz = b[1] - a[1]
    const longueur = Math.hypot(dx, dz) + mur.epaisseur
    return {
      cle: `${a[0]},${a[1]}`,
      position: [(a[0] + b[0]) / 2, mur.z0 + mur.hauteur / 2, (a[1] + b[1]) / 2] as const,
      angle: -Math.atan2(dz, dx),
      longueur,
    }
  })

  const prof = rondins.y1 - rondins.y0
  return (
    <group>
      <Calque groupe={mur.groupe}>
        {segments.map((s) => (
          <mesh
            key={s.cle}
            position={s.position}
            rotation={[0, s.angle, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[s.longueur, mur.hauteur, mur.epaisseur]} />
            <Mat couleur={palette.mur_voisins} />
            <Aretes repere={mur.id} />
          </mesh>
        ))}
      </Calque>
      <Calque groupe={rondins.groupe}>
        {Array.from({ length: rondins.nombre }, (_, i) => {
          const x = rondins.x_depart + i * rondins.pas + rondins.largeur / 2
          return (
            <mesh
              key={i}
              position={[x, rondins.z0 + rondins.hauteur / 2, (rondins.y0 + rondins.y1) / 2]}
              castShadow
            >
              <boxGeometry args={[rondins.largeur, rondins.hauteur, prof]} />
              <Mat couleur={palette.beton} />
              <Aretes repere={rondins.id} />
            </mesh>
          )
        })}
      </Calque>
    </group>
  )
}

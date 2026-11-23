import { elementParId, palette, type ElementBoite, type ElementBoites } from '../data/scene'
import { BoitePlan } from './Houses'
import { Aretes, Calque, Mat } from './materiaux'

// Repère 5 : douche et cabanon, posés sur la dalle. Repère 6 : palissade.
export function ShowerShed() {
  const ensemble = elementParId(5) as ElementBoites
  const palissade = elementParId(6) as ElementBoite
  return (
    <Calque groupe={ensemble.groupe}>
      {ensemble.boites.map((b) => (
        <mesh
          key={b.nom}
          position={[(b.x0 + b.x1) / 2, b.z0 + b.hauteur / 2, (b.y0 + b.y1) / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[b.x1 - b.x0, b.hauteur, b.y1 - b.y0]} />
          <Mat couleur={b.couleur} />
          <Aretes repere={ensemble.id} />
        </mesh>
      ))}
      <BoitePlan el={palissade} couleur={palette.palissade} />
    </Calque>
  )
}

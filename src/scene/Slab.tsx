import { useMemo } from 'react'
import { elementParId, palette, type ElementDalle } from '../data/scene'
import { extrusionPlan } from '../lib/geom'
import { Aretes, Calque, Mat } from './materiaux'

// Repère 4 : dalle en béton. Le dessus est à z, l'épaisseur est prise en dessous.
export function Slab() {
  const dalle = elementParId(4) as ElementDalle
  const geo = useMemo(
    () => extrusionPlan(dalle.polygone, dalle.z - dalle.epaisseur, dalle.epaisseur),
    [dalle],
  )
  return (
    <Calque groupe={dalle.groupe}>
      <mesh geometry={geo} receiveShadow castShadow>
        <Mat couleur={palette.beton} />
        <Aretes repere={dalle.id} />
      </mesh>
    </Calque>
  )
}

import { useMemo } from 'react'
import { elementParId, palette, type ElementBoite, type ElementMaison } from '../data/scene'
import { toitDeuxPans } from '../lib/geom'
import { Aretes, Calque, Mat } from './materiaux'

interface CouleursMaison {
  murs: string
  toit: string
  opacite: number
}

/** Maison à toit à deux pans : boîte des murs, puis prisme du toit (pignons couleur murs). */
function Maison({ el, c }: { el: ElementMaison; c: CouleursMaison }) {
  const { x0, y0, x1, y1, z0, hauteur_murs: hm, faitage } = el
  const toit = useMemo(
    () => toitDeuxPans(x0, y0, x1, y1, z0 + hm, faitage),
    [x0, y0, x1, y1, z0, hm, faitage],
  )
  const opaque = c.opacite >= 1
  return (
    <group>
      <mesh
        position={[(x0 + x1) / 2, z0 + hm / 2, (y0 + y1) / 2]}
        castShadow={opaque}
        receiveShadow={opaque}
        renderOrder={opaque ? 0 : 2}
      >
        <boxGeometry args={[x1 - x0, hm, y1 - y0]} />
        <Mat couleur={c.murs} opacite={c.opacite} />
        <Aretes opacite={opaque ? 0.55 : 0.8} repere={el.id} />
      </mesh>
      <mesh geometry={toit} castShadow={opaque} renderOrder={opaque ? 0 : 2}>
        <meshStandardMaterial
          attach="material-0"
          color={c.murs}
          roughness={0.9}
          transparent={!opaque}
          opacity={c.opacite}
          depthWrite={opaque}
        />
        <meshStandardMaterial
          attach="material-1"
          color={c.toit}
          roughness={0.9}
          transparent={!opaque}
          opacity={c.opacite}
          depthWrite={opaque}
        />
        <Aretes opacite={opaque ? 0.55 : 0.8} repere={el.id} />
      </mesh>
    </group>
  )
}

/** Boîte simple du plan (annexe, palissade…). */
export function BoitePlan({ el, couleur }: { el: ElementBoite; couleur: string }) {
  const { x0, y0, x1, y1, z0, hauteur } = el
  return (
    <mesh position={[(x0 + x1) / 2, z0 + hauteur / 2, (y0 + y1) / 2]} castShadow receiveShadow>
      <boxGeometry args={[x1 - x0, hauteur, y1 - y0]} />
      <Mat couleur={couleur} />
      <Aretes repere={el.id} />
    </mesh>
  )
}

// Repère 1 : maison voisine (opaque). Repère 11 : maison de Paula, transparente,
// à l'opacité de la spécification. Repère 12 : annexe.
export function Houses() {
  const voisine = elementParId(1) as ElementMaison
  const paula = elementParId(11) as ElementMaison
  const annexe = elementParId(12) as ElementBoite
  return (
    <group>
      <Calque groupe="voisins">
        <Maison
          el={voisine}
          c={{ murs: palette.maison_voisine_murs, toit: palette.maison_voisine_toit, opacite: 1 }}
        />
      </Calque>
      <Calque groupe="paula">
        <BoitePlan el={annexe} couleur={palette.maison_paula_murs} />
        <Maison
          el={paula}
          c={{
            murs: palette.maison_paula_murs,
            toit: palette.maison_paula_toit,
            opacite: paula.transparence_vue_ensemble ?? 1,
          }}
        />
      </Calque>
    </group>
  )
}

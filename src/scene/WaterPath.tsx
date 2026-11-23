import { Line } from '@react-three/drei'
import { useMemo } from 'react'
import { Quaternion, Vector3 } from 'three'
import { elementParId, palette, scene, type ElementNappe } from '../data/scene'
import { toThree } from '../lib/coords'
import { useStore } from '../store'
import { Calque } from './materiaux'

// Réglages visuels de la vue d'ensemble : flèches d'écoulement probable et nappe (repère 15).
// Convention de la légende : trait plein en surface, pointillé dans le sol (supposé).
// Dessinées après la maison de Paula (transparente) pour rester lisibles à travers elle.
const ORDRE = 3
const TETE_LONGUEUR = 0.8
const TETE_RAYON = 0.32

function Fleche({ de, a }: { de: Vector3; a: Vector3 }) {
  const dansLeSol = Math.min(de.y, a.y) < 0
  const dir = a.clone().sub(de).normalize()
  const base = a.clone().addScaledVector(dir, -TETE_LONGUEUR)
  const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir)
  const milieuTete = base.clone().addScaledVector(dir, TETE_LONGUEUR / 2)
  return (
    <group>
      <Line
        points={[de, base]}
        color={palette.eau}
        lineWidth={4}
        transparent
        renderOrder={ORDRE}
        dashed={dansLeSol}
        dashSize={0.25}
        gapSize={0.2}
      />
      <mesh position={milieuTete} quaternion={q} renderOrder={ORDRE}>
        <coneGeometry args={[TETE_RAYON, TETE_LONGUEUR, 12]} />
        <meshBasicMaterial color={palette.eau} transparent />
      </mesh>
    </group>
  )
}

export function WaterPath() {
  const nappe = elementParId(15) as ElementNappe
  const choisi = useStore((s) => s.selection === nappe.id)
  const fleches = useMemo(
    () => scene.fleches_eau_vue_ensemble.map(([de, a]) => ({ de: toThree(de), a: toThree(a) })),
    [],
  )
  const contour = useMemo(
    () =>
      Array.from({ length: 65 }, (_, i) => {
        const t = (i / 64) * Math.PI * 2
        return new Vector3(
          nappe.centre[0] + nappe.rayon_x * Math.cos(t),
          nappe.z,
          nappe.centre[1] + nappe.rayon_y * Math.sin(t),
        )
      }),
    [nappe],
  )
  return (
    <Calque groupe={nappe.groupe}>
      {fleches.map((f, i) => (
        <Fleche key={i} de={f.de} a={f.a} />
      ))}
      {/* La nappe est sous le sol : on la dessine par-dessus, comme sur la planche. */}
      <mesh
        position={[nappe.centre[0], nappe.z, nappe.centre[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[nappe.rayon_x, nappe.rayon_y, 1]}
        renderOrder={5}
      >
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial color={palette.eau_clair} transparent opacity={0.55} depthTest={false} />
      </mesh>
      <Line
        points={contour}
        color={palette.eau}
        lineWidth={choisi ? 3.5 : 1.5}
        dashed
        dashSize={0.3}
        gapSize={0.2}
        depthTest={false}
        renderOrder={6}
      />
    </Calque>
  )
}

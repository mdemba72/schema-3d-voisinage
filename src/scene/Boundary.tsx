import { Line } from '@react-three/drei'
import { useMemo } from 'react'
import { elementParId, type ElementLimite, type Point2 } from '../data/scene'
import { hauteurSol } from '../lib/sol'
import { useStore } from '../store'
import { Calque } from './materiaux'
import { RUGOSITE } from './reglages'

// Réglages visuels : nombre d'échantillons, décalage au-dessus du sol, tailles des bornes.
const ECHANTILLONS = 80
const DECALAGE = 0.05

// Repère 14 : limite en tirets, posée sur le sol, et les deux bornes.
export function Boundary() {
  const limite = elementParId(14) as ElementLimite
  const points = useMemo(() => {
    const { de, a } = limite.ligne
    return Array.from({ length: ECHANTILLONS + 1 }, (_, i) => {
      const t = i / ECHANTILLONS
      const p: Point2 = [de[0] + t * (a[0] - de[0]), de[1] + t * (a[1] - de[1])]
      return [p[0], hauteurSol(p) + DECALAGE, p[1]] as [number, number, number]
    })
  }, [limite])

  const choisi = useStore((s) => s.selection === limite.id)
  return (
    <Calque groupe={limite.groupe}>
      <Line
        points={points}
        color={limite.ligne.couleur}
        lineWidth={choisi ? 5 : 3}
        dashed
        dashSize={0.45}
        gapSize={0.3}
      />
      {limite.bornes.map((b) => (
        <mesh key={b.forme} position={[b.position[0], b.z, b.position[1]]} castShadow>
          {b.forme === 'ronde' ? (
            <cylinderGeometry args={[0.25, 0.25, 0.3, 16]} />
          ) : (
            <coneGeometry args={[0.38, 0.5, 3]} />
          )}
          <meshStandardMaterial color={limite.ligne.couleur} roughness={RUGOSITE} />
        </mesh>
      ))}
    </Calque>
  )
}

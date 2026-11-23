import { useMemo } from 'react'
import { palette, scene } from '../data/scene'
import { extrusionPlan, solPlan } from '../lib/geom'
import { useStore } from '../store'
import { Aretes } from './materiaux'
import { RUGOSITE, textureHachures } from './reglages'

// Sols : terrain de Paula (z = 0), voiries, et terrain rehaussé des voisins
// extrudé de 0 à RZ, dont les flancs montrent le remblai en hachures.
export function Ground() {
  const { terrain_paula, terrain_voisins_rehausse, voiries } = scene.sols

  const geoPaula = useMemo(() => solPlan(terrain_paula.polygone, terrain_paula.z), [terrain_paula])
  const geoVoiries = useMemo(() => voiries.map((v) => solPlan(v.polygone, -0.02)), [voiries])
  const geoRemblai = useMemo(
    () => extrusionPlan(terrain_voisins_rehausse.polygone, 0, terrain_voisins_rehausse.z),
    [terrain_voisins_rehausse],
  )
  const hachures = useMemo(() => textureHachures(), [])
  // « Sous la maison » : sol de Paula semi-transparent pour voir dessous.
  const sous = useStore((s) => s.mode === 'sous')

  return (
    <group>
      <mesh geometry={geoPaula} receiveShadow>
        <meshStandardMaterial
          color={palette.sol_paula}
          roughness={RUGOSITE}
          transparent={sous}
          opacity={sous ? 0.5 : 1}
          depthWrite={!sous}
        />
      </mesh>
      {geoVoiries.map((g, i) => (
        <mesh key={voiries[i]!.nom} geometry={g} receiveShadow>
          <meshStandardMaterial color={palette.voirie} roughness={RUGOSITE} />
        </mesh>
      ))}
      <mesh geometry={geoRemblai} receiveShadow castShadow>
        {/* groupe 0 : dessus et dessous ; groupe 1 : flancs */}
        <meshStandardMaterial
          attach="material-0"
          color={palette.sol_voisins}
          roughness={RUGOSITE}
        />
        <meshStandardMaterial attach="material-1" map={hachures} roughness={RUGOSITE} />
        <Aretes opacite={0.4} repere={3} />
      </mesh>
    </group>
  )
}

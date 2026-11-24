import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { lazy, Suspense, useEffect } from 'react'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { palette, scene } from '../data/scene'
import { useStore } from '../store'
import { CameraRig } from './CameraRig'
import { EMPRISE, FOV } from './cadrage'
import { Boundary } from './Boundary'
import { Ground } from './Ground'
import { Houses } from './Houses'
import { Markers } from './Markers'
import { Rain } from './Rain'
import { ShowerShed } from './ShowerShed'
import { Slab } from './Slab'
import { ZoneExpert } from './ZoneExpert'
import { Bambous } from './Bambous'
import { Descentes } from './Descentes'
import { Vegetation } from './Vegetation'
import { Wall } from './Wall'
import { WaterPath } from './WaterPath'

// Mode « Sous la maison » chargé à part (lazy-load) : absent du premier affichage.
const chargerSous = () => import('./Underground')
const Underground = lazy(() => chargerSous().then((m) => ({ default: m.Underground })))
/** Délai avant de précharger le mode « Sous la maison », une fois la scène affichée. */
const PRECHARGEMENT_MS = 4000

const POSITION_INITIALE = new Vector3(38, 30, 34)

/** Hauteur maximale de la cible : la plus haute ancre de repère. */
const HAUT_MAX = Math.max(...scene.elements.map((e) => e.ancre[2]))

/** Profondeur atteinte par la coupe « Sous la maison » (fond du regard). */
const BAS_SOUS = scene.sous_sol.regard.z0

/** Pan limité à l'emprise de la scène (sous le sol seulement en mode « Sous la maison »). */
function bornerCible(controles: OrbitControlsImpl) {
  const { min, max } = EMPRISE
  const t = controles.target
  const avant = t.clone()
  const bas = useStore.getState().mode === 'sous' ? BAS_SOUS : 0
  t.set(
    Math.min(max.x, Math.max(min.x, t.x)),
    Math.min(HAUT_MAX, Math.max(bas, t.y)),
    Math.min(max.z, Math.max(min.z, t.z)),
  )
  controles.object.position.add(t.clone().sub(avant))
}

export function Scene3D() {
  const mode = useStore((s) => s.mode)
  const sous = mode === 'sous'
  // Une fois chargé, le mode reste monté : il remet la coupe à zéro en quittant le mode.
  const sousCharge = useStore((s) => s.sousVisite)
  useEffect(() => {
    const t = window.setTimeout(() => void chargerSous(), PRECHARGEMENT_MS)
    return () => window.clearTimeout(t)
  }, [])
  // Toucher la scène met en pause la lecture automatique des étapes.
  const pause = () => {
    if (useStore.getState().lecture) useStore.getState().lire(false)
  }
  return (
    <Canvas
      className="canvas-3d"
      dpr={[1, 2]}
      flat
      shadows
      frameloop="demand"
      camera={{ fov: FOV, near: 1, far: 1000, position: POSITION_INITIALE.toArray() }}
      onPointerDown={pause}
    >
      <hemisphereLight args={[palette.papier, palette.terre, 1.6]} />
      <directionalLight
        position={[-14, 40, 22]}
        intensity={1.9}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-far={120}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />

      <Ground />
      <Houses />
      <Wall />
      <Slab />
      <ShowerShed />
      {!sous && <Vegetation />}
      {!sous && <Bambous />}
      <Descentes />
      <Boundary />
      {!sous && <WaterPath />}
      <Rain />
      <Suspense fallback={null}>{(sous || sousCharge) && <Underground />}</Suspense>
      <ZoneExpert />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.12}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2 - 0.12}
        screenSpacePanning={false}
        onChange={(e) => e && bornerCible(e.target as OrbitControlsImpl)}
      />
      <CameraRig />
      <Markers />
    </Canvas>
  )
}

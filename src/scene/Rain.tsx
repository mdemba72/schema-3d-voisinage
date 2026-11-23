import { Html, Line } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, InstancedMesh, Object3D } from 'three'
import { palette, scene } from '../data/scene'
import { toThree } from '../lib/coords'
import { durees, effetEtape, MAX_GOUTTES, positionA } from '../lib/pluie'
import { useStore } from '../store'
import { useMedia } from '../ui/useMedia'

// Réglages visuels des gouttes.
const RAYON = 0.11
const ETIREMENT_CHUTE = 3.2
const OPACITE = 0.8
const ORDRE_TRAVERSE = 7

const temp = new Object3D()
const couleurs = { eau: new Color(palette.eau), boue: new Color(palette.boue) }

/** Gouttes de l'étape : elles tombent, puis ruissellent le long des surfaces et des flèches. */
function Gouttes({ etape, reduit }: { etape: number; reduit: boolean }) {
  const ref = useRef<InstancedMesh>(null)
  const invalidate = useThree((s) => s.invalidate)
  const effet = useMemo(() => effetEtape(etape), [etape])
  const trajets = useMemo(() => effet.trajets.slice(0, MAX_GOUTTES), [effet])
  const ds = useMemo(() => trajets.map((t) => durees(t)), [trajets])

  const placer = (s: number) => {
    const m = ref.current
    if (!m) return
    trajets.forEach((t, i) => {
      const { p, segment, progres } = positionA(t, ds[i]!, s)
      const v = toThree(p)
      // La goutte apparaît puis s'efface en rétrécissant aux deux bouts du trajet.
      const bord = Math.min(1, progres / 0.06, (1 - progres) / 0.12)
      const etire = t.chute && segment === 0 ? ETIREMENT_CHUTE : 1
      temp.position.copy(v)
      temp.scale.set(RAYON * bord, RAYON * bord * etire, RAYON * bord)
      temp.updateMatrix()
      m.setMatrixAt(i, temp.matrix)
    })
    m.count = trajets.length
    m.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    trajets.forEach((t, i) => m.setColorAt(i, couleurs[t.couleur]))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    // Mouvement réduit : l'eau avance par étapes, gouttes figées le long du parcours.
    placer(0)
    invalidate()
    // placer ne dépend que des trajets
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trajets, invalidate])

  useFrame(({ clock }) => {
    if (reduit) return
    placer(clock.elapsedTime)
    invalidate()
  })

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, MAX_GOUTTES]}
      frustumCulled={false}
      renderOrder={effet.traverse ? ORDRE_TRAVERSE : 3}
    >
      <sphereGeometry args={[1, 8, 6]} />
      <meshBasicMaterial
        transparent
        opacity={OPACITE}
        depthTest={!effet.traverse}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

/** Ancien écoulement (étape 4) : pointillés, croix, mention « tracé supposé ». */
function AncienEcoulement() {
  const anc = scene.ancien_ecoulement
  const points = anc.trajet.map(toThree)
  const c = toThree(anc.croix)
  const k = 0.45
  // Étiquette au premier quart du tracé, pour ne pas masquer la croix.
  const milieu = points[0]!.clone().lerp(points[points.length - 1]!, 0.22)
  return (
    <group>
      <Line
        points={points}
        color={palette.eau}
        lineWidth={3}
        dashed
        dashSize={0.3}
        gapSize={0.25}
      />
      <Line
        points={[
          [c.x - k, c.y + 0.02, c.z - k],
          [c.x + k, c.y + 0.02, c.z + k],
        ]}
        color={palette.encre}
        lineWidth={4}
      />
      <Line
        points={[
          [c.x - k, c.y + 0.02, c.z + k],
          [c.x + k, c.y + 0.02, c.z - k],
        ]}
        color={palette.encre}
        lineWidth={4}
      />
      <Html position={[milieu.x, milieu.y + 0.6, milieu.z]} center zIndexRange={[20, 0]}>
        <span className="etiquette-scene">{anc.mention}</span>
      </Html>
    </group>
  )
}

/** Point d'interrogation (destination de l'eau inconnue). */
function Interrogation({ position }: { position: [number, number, number] }) {
  return (
    <Html position={toThree(position)} center zIndexRange={[20, 0]}>
      <span className="interrogation" role="img" aria-label="Destination à vérifier">
        ?
      </span>
    </Html>
  )
}

// Mode « Quand il pleut » : l'effet d'eau de l'étape courante.
export function Rain() {
  const mode = useStore((s) => s.mode)
  const etape = useStore((s) => s.etapePluie)
  const reduit = useMedia('(prefers-reduced-motion: reduce)')
  const effet = useMemo(() => effetEtape(etape), [etape])
  if (mode !== 'pluie') return null
  return (
    <group>
      <Gouttes key={etape} etape={etape} reduit={reduit} />
      {effet.ancienEcoulement && <AncienEcoulement />}
      {effet.interrogations.map((p) => (
        <Interrogation key={p.join(',')} position={p} />
      ))}
    </group>
  )
}

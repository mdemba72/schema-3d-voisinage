import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CurvePath, LineCurve3, TubeGeometry, Vector3, type InstancedMesh, Object3D } from 'three'
import { palette, type Point3 } from '../data/scene'
import { ETAPES_SOUS, pointSur } from '../lib/sousSol'
import { useMedia } from '../ui/useMedia'

// Filet d'eau du mode « Sous la maison » : un tube par étape, le long de son trajet,
// qui se dessine progressivement (drawRange), puis quelques particules qui le parcourent.

const SEGMENTS = 64
const COTES = 8
const RAYON = 0.07
const RAYON_COURANT = 0.09
/** Le filet est posé juste devant les capuchons de la coupe. */
const RECUL = 0.02
const DUREE_DESSIN = 1.4 // s
const PARTICULES = 6
const DUREE_PARCOURS = 2.4 // s pour un passage de particule

const temp = new Object3D()

function versScene(p: Point3): Vector3 {
  const [x, y, z] = p
  return new Vector3(x - RECUL, z, y)
}

function tube(trajet: Point3[], rayon: number): TubeGeometry {
  const chemin = new CurvePath<Vector3>()
  for (let i = 1; i < trajet.length; i++)
    chemin.add(new LineCurve3(versScene(trajet[i - 1]!), versScene(trajet[i]!)))
  return new TubeGeometry(chemin, SEGMENTS, rayon, COTES, false)
}

const couleurDe = (c: string) => (c === 'boue' ? palette.boue : palette.eau)

/** Étape en cours : le tube se dessine, puis les particules le parcourent. */
function Courant({ i, reduit }: { i: number; reduit: boolean }) {
  const e = ETAPES_SOUS[i]!
  const geo = useMemo(() => tube(e.trajet, RAYON_COURANT), [e])
  const particules = useRef<InstancedMesh>(null)
  const debut = useRef<number | null>(null)
  const invalidate = useThree((s) => s.invalidate)

  useFrame(({ clock }) => {
    const t0 = (debut.current ??= clock.elapsedTime)
    const t = reduit ? Infinity : clock.elapsedTime - t0
    const f = Math.min(1, t / DUREE_DESSIN)
    // Nombre d'indices arrondi à un segment entier du tube (6 indices par face, COTES faces).
    geo.setDrawRange(0, Math.ceil(f * SEGMENTS) * COTES * 6)
    const m = particules.current
    if (m) {
      for (let k = 0; k < PARTICULES; k++) {
        // Mouvement réduit : particules fixes, réparties le long du trajet.
        const s = reduit ? (k + 0.5) / PARTICULES : (t / DUREE_PARCOURS + k / PARTICULES) % 1
        const visible = reduit || f >= 1
        const [x, y, z] = pointSur(e.trajet, s)
        temp.position.copy(versScene([x, y, z]))
        temp.scale.setScalar(visible ? 1 : 0)
        temp.updateMatrix()
        m.setMatrixAt(k, temp.matrix)
      }
      m.instanceMatrix.needsUpdate = true
    }
    if (!reduit) invalidate()
  })

  return (
    <group>
      <mesh geometry={geo} renderOrder={6}>
        <meshBasicMaterial color={couleurDe(e.couleur)} />
      </mesh>
      <instancedMesh
        ref={particules}
        args={[undefined, undefined, PARTICULES]}
        frustumCulled={false}
        renderOrder={7}
      >
        <sphereGeometry args={[0.13, 10, 8]} />
        <meshBasicMaterial color={e.couleur === 'boue' ? palette.terre_fonce : palette.eau_clair} />
      </instancedMesh>
    </group>
  )
}

/** Étape déjà parcourue : tube complet, atténué. */
function Passe({ i }: { i: number }) {
  const e = ETAPES_SOUS[i]!
  const geo = useMemo(() => tube(e.trajet, RAYON), [e])
  return (
    <mesh geometry={geo} renderOrder={5}>
      <meshBasicMaterial
        color={couleurDe(e.couleur)}
        transparent
        opacity={0.5}
        depthWrite={false}
      />
    </mesh>
  )
}

/** Filet des étapes A jusqu'à l'étape courante (les suivantes restent cachées). */
export function FiletEau({ courant }: { courant: number }) {
  const reduit = useMedia('(prefers-reduced-motion: reduce)')
  return (
    <group>
      {ETAPES_SOUS.slice(0, courant).map((e, i) => (
        <Passe key={e.etape} i={i} />
      ))}
      <Courant key={courant} i={courant} reduit={reduit} />
    </group>
  )
}

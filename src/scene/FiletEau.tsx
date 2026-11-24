import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  CanvasTexture,
  CurvePath,
  LineCurve3,
  NearestFilter,
  RepeatWrapping,
  TubeGeometry,
  Vector3,
  type InstancedMesh,
  type Texture,
  Object3D,
} from 'three'
import { palette, type Point3 } from '../data/scene'
import { ETAPES_SOUS, longueursCumulees, pointSur } from '../lib/sousSol'
import { troncons } from '../lib/troncons'
import { useMedia } from '../ui/useMedia'

// Filet d'eau du mode « Sous la maison » : par étape, un tube par tronçon du trajet,
// en trait plein en surface et en pointillés dans le sol (légende : « dans le sol, supposé »).
// Le tube se dessine progressivement (drawRange), puis des particules le parcourent.

const SEGMENTS = 64
const COTES = 8
const RAYON = 0.07
const RAYON_COURANT = 0.09
/** Le filet est posé juste devant les capuchons de la coupe. */
const RECUL = 0.02
const DUREE_DESSIN = 1.4 // s
const PARTICULES = 6
const DUREE_PARCOURS = 2.4 // s pour un passage de particule
/** Longueur d'un tiret plus son espace (m). */
const PAS_TIRET = 0.32

const temp = new Object3D()

function versScene(p: Point3): Vector3 {
  const [x, y, z] = p
  return new Vector3(x - RECUL, z, y)
}

/** Motif des pointillés le long du tube : moitié pleine, moitié vide. */
let motif: CanvasTexture | null = null
function motifTirets(): CanvasTexture {
  if (motif) return motif
  const c = document.createElement('canvas')
  c.width = 8
  c.height = 1
  const g = c.getContext('2d')!
  g.fillStyle = '#000'
  g.fillRect(0, 0, 8, 1)
  g.fillStyle = '#fff'
  g.fillRect(0, 0, 5, 1)
  motif = new CanvasTexture(c)
  motif.wrapS = RepeatWrapping
  motif.magFilter = NearestFilter
  motif.minFilter = NearestFilter
  return motif
}

interface Morceau {
  geo: TubeGeometry
  /** Tirets (dans le sol) ou null (trait plein). */
  tirets: Texture | null
  segments: number
  /** Début et longueur du tronçon, en fraction de la longueur du trajet. */
  debut: number
  part: number
}

function longueur(points: Point3[]): number {
  const l = longueursCumulees(points)
  return l[l.length - 1]!
}

/** Un tube par tronçon, avec ses pointillés si le tronçon est dans le sol. */
function morceaux(trajet: Point3[], rayon: number): Morceau[] {
  const total = longueur(trajet)
  let fait = 0
  return troncons(trajet).map((t) => {
    const l = longueur(t.points)
    const chemin = new CurvePath<Vector3>()
    for (let i = 1; i < t.points.length; i++)
      chemin.add(new LineCurve3(versScene(t.points[i - 1]!), versScene(t.points[i]!)))
    const segments = Math.max(4, Math.round((SEGMENTS * l) / total))
    let tirets: Texture | null = null
    if (t.sol) {
      tirets = motifTirets().clone()
      tirets.repeat.set(Math.max(1, Math.round(l / PAS_TIRET)), 1)
      tirets.needsUpdate = true
    }
    const m: Morceau = {
      geo: new TubeGeometry(chemin, segments, rayon, COTES, false),
      tirets,
      segments,
      debut: fait / total,
      part: l / total,
    }
    fait += l
    return m
  })
}

const couleurDe = (c: string) => (c === 'boue' ? palette.boue : palette.eau)

/** Étape en cours : les tubes se dessinent, puis les particules les parcourent. */
function Courant({ i, reduit }: { i: number; reduit: boolean }) {
  const e = ETAPES_SOUS[i]!
  const liste = useMemo(() => morceaux(e.trajet, RAYON_COURANT), [e])
  const particules = useRef<InstancedMesh>(null)
  const debut = useRef<number | null>(null)
  const invalidate = useThree((s) => s.invalidate)

  useFrame(({ clock }) => {
    const t0 = (debut.current ??= clock.elapsedTime)
    const t = reduit ? Infinity : clock.elapsedTime - t0
    const f = Math.min(1, t / DUREE_DESSIN)
    for (const m of liste) {
      const local = Math.min(1, Math.max(0, (f - m.debut) / m.part))
      // Nombre d'indices arrondi à un segment entier du tube (6 indices par face, COTES faces).
      m.geo.setDrawRange(0, Math.ceil(local * m.segments) * COTES * 6)
    }
    const p = particules.current
    if (p) {
      for (let k = 0; k < PARTICULES; k++) {
        // Mouvement réduit : particules fixes, réparties le long du trajet.
        const s = reduit ? (k + 0.5) / PARTICULES : (t / DUREE_PARCOURS + k / PARTICULES) % 1
        const visible = reduit || f >= 1
        temp.position.copy(versScene(pointSur(e.trajet, s)))
        temp.scale.setScalar(visible ? 1 : 0)
        temp.updateMatrix()
        p.setMatrixAt(k, temp.matrix)
      }
      p.instanceMatrix.needsUpdate = true
    }
    if (!reduit) invalidate()
  })

  return (
    <group>
      {liste.map((m, k) => (
        <mesh key={k} geometry={m.geo} renderOrder={6}>
          <meshBasicMaterial
            color={couleurDe(e.couleur)}
            alphaMap={m.tirets}
            alphaTest={m.tirets ? 0.5 : 0}
          />
        </mesh>
      ))}
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

/** Étape déjà parcourue : tubes complets, atténués. */
function Passe({ i }: { i: number }) {
  const e = ETAPES_SOUS[i]!
  const liste = useMemo(() => morceaux(e.trajet, RAYON), [e])
  return (
    <>
      {liste.map((m, k) => (
        <mesh key={k} geometry={m.geo} renderOrder={5}>
          <meshBasicMaterial
            color={couleurDe(e.couleur)}
            transparent
            opacity={0.5}
            depthWrite={false}
            alphaMap={m.tirets}
            alphaTest={m.tirets ? 0.5 : 0}
          />
        </mesh>
      ))}
    </>
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

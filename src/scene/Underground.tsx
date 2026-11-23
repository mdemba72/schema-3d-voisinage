import { Edges, Html, Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import {
  DoubleSide,
  Mesh,
  Plane,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  Vector2,
  Vector3,
  type Material,
  type Object3D,
  type Texture,
} from 'three'
import {
  elementParId,
  palette,
  scene,
  type ElementMaison,
  type ElementNappe,
  type Point3,
} from '../data/scene'
import { toThree } from '../lib/coords'
import { COUPE_X, ETAPES_SOUS } from '../lib/sousSol'
import { useStore } from '../store'
import { FiletEau } from './FiletEau'
import { textureGrains, textureHachures, textureMoellons } from './reglages'

// Mode « Sous la maison » : coupe verticale au plan x = sous_sol.plan_de_coupe_x.
// Tout ce qui est au-delà du plan (côté caméra) est coupé ; la face coupée est dessinée
// par des « capuchons » plats posés juste derrière le plan, aux couleurs de la planche 2.

const ss = scene.sous_sol
const RZ = scene.constantes.RZ

/** Plan de coupe : garde x ≤ COUPE_X (le côté x > COUPE_X est retiré). */
const PLAN = new Plane(new Vector3(-1, 0, 0), COUPE_X)
const PLANS = [PLAN]

/** Élargissement visuel de l'espace de 3 cm entre le mur et la façade (signalé à l'écran). */
const ELARGI = 0.09

// Recul des capuchons derrière le plan de coupe (m) : fond, milieu, devant.
const FOND = 0.1
const MILIEU = 0.08
const DEVANT = 0.06
const DETAIL = 0.045

/** Nappe du vide sanitaire (repère 15), montrée à partir de l'étape F. */
const nappe = elementParId(15) as ElementNappe
const INDEX_NAPPE = ETAPES_SOUS.findIndex((e) => e.etape === 'F')
const NAPPE = 0.07

/** Taille d'un motif de texture dans la coupe (m). */
const MOTIF = 0.6

interface RectProps {
  y0: number
  y1: number
  z0: number
  z1: number
  couleur?: string
  texture?: Texture
  recul: number
  opacite?: number
  aretes?: boolean
}

/** Rectangle de la coupe, en coordonnées du plan (y horizontal, z vertical), tourné vers +x. */
function Rect({ y0, y1, z0, z1, couleur, texture, recul, opacite = 1, aretes }: RectProps) {
  const geo = useMemo(() => {
    const g = new PlaneGeometry(y1 - y0, z1 - z0)
    // UV en mètres, pour garder un motif de même taille partout.
    const uv = g.attributes.uv!
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, (uv.getX(i) * (y1 - y0)) / MOTIF, (uv.getY(i) * (z1 - z0)) / MOTIF)
    return g
  }, [y0, y1, z0, z1])
  return (
    <mesh
      geometry={geo}
      position={[COUPE_X - recul, (z0 + z1) / 2, (y0 + y1) / 2]}
      rotation={[0, Math.PI / 2, 0]}
    >
      <meshBasicMaterial
        color={texture ? '#ffffff' : couleur}
        map={texture ?? null}
        transparent={opacite < 1}
        opacity={opacite}
        depthWrite={opacite >= 1}
      />
      {aretes && <Edges color={palette.encre} />}
    </mesh>
  )
}

/** Polygone plein de la coupe (pignon), en coordonnées (y, z) du plan. */
function Profil({
  points,
  couleur,
  recul,
}: {
  points: [number, number][]
  couleur: string
  recul: number
}) {
  const geo = useMemo(() => {
    // La forme est dessinée en (-y, z) : après rotation, elle retrouve le sens du plan.
    const s = new Shape(points.map(([y, z]) => new Vector2(-y, z)))
    return new ShapeGeometry(s)
  }, [points])
  return (
    <mesh geometry={geo} position={[COUPE_X - recul, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      <meshBasicMaterial color={couleur} side={DoubleSide} />
      <Edges color={palette.encre} />
    </mesh>
  )
}

/** Étiquette posée dans la coupe. */
function Etiquette({ position, texte }: { position: Point3; texte: string }) {
  return (
    <Html position={toThree(position)} center zIndexRange={[20, 0]}>
      <span className="etiquette-scene">{texte}</span>
    </Html>
  )
}

/** Point d'interrogation : zone que personne n'a encore vue. */
function Interrogation({ position, nom }: { position: Point3; nom: string }) {
  return (
    <Html position={toThree(position)} zIndexRange={[20, 0]}>
      <span
        className="interrogation interrogation-coupe"
        role="img"
        aria-label={`À vérifier : ${nom}`}
      >
        ?
      </span>
    </Html>
  )
}

/** Cuvette de WC vue de profil : socle, cuvette, réservoir ; descente vers le collecteur. */
function Wc({ y, z }: { y: number; z: number }) {
  const blanc = palette.maison_voisine_murs
  const c = ss.collecteur
  return (
    <group>
      <Rect
        y0={y - 0.03}
        y1={y + 0.03}
        z0={c.de[2]}
        z1={z}
        couleur={palette.beton_fonce}
        recul={DEVANT}
      />
      <Rect y0={y - 0.12} y1={y + 0.12} z0={z} z1={z + 0.2} couleur={blanc} recul={DETAIL} aretes />
      <Rect
        y0={y - 0.25}
        y1={y + 0.2}
        z0={z + 0.2}
        z1={z + 0.42}
        couleur={blanc}
        recul={DETAIL}
        aretes
      />
      <Rect
        y0={y + 0.12}
        y1={y + 0.3}
        z0={z + 0.42}
        z1={z + 0.8}
        couleur={blanc}
        recul={DETAIL}
        aretes
      />
    </group>
  )
}

/** Regard : parois, intérieur, boue et cailloux au fond. */
function Regard() {
  const { centre, cote, z0, z1 } = ss.regard
  const y0 = centre[1] - cote / 2
  const y1 = centre[1] + cote / 2
  const paroi = 0.08
  const fond = z0 + paroi
  const cailloux = [0.2, 0.38, 0.55, 0.7]
  return (
    <group>
      <Rect y0={y0} y1={y1} z0={z0} z1={z1} couleur={palette.beton} recul={MILIEU} aretes />
      <Rect
        y0={y0 + paroi}
        y1={y1 - paroi}
        z0={fond}
        z1={z1}
        couleur={palette.papier}
        recul={DEVANT}
      />
      <Rect
        y0={y0 + paroi}
        y1={y1 - paroi}
        z0={fond}
        z1={fond + 0.16}
        couleur={palette.boue}
        recul={DETAIL}
      />
      {cailloux.map((k) => (
        <mesh
          key={k}
          position={[COUPE_X - DETAIL + 0.01, fond + 0.17, y0 + paroi + k * (cote - 2 * paroi)]}
        >
          <sphereGeometry args={[0.06, 8, 6]} />
          <meshBasicMaterial color={palette.attenue} />
        </mesh>
      ))}
    </group>
  )
}

/** Maison de Paula coupée : intérieur clair, murs, plancher, pignon en trait. */
function MaisonCoupee() {
  const m = elementParId(11) as ElementMaison
  const arr = ss.fondations[0]!
  const fac = ss.fondations[1]!
  const haut = m.z0 + m.hauteur_murs
  const pl = ss.plancher
  const yc = (fac.y0 + arr.y1) / 2
  return (
    <group>
      <Rect
        y0={fac.y1}
        y1={arr.y0}
        z0={pl.z}
        z1={haut}
        couleur={palette.maison_paula_murs}
        recul={MILIEU}
        opacite={0.7}
      />
      <Rect
        y0={fac.y0}
        y1={fac.y1}
        z0={pl.z}
        z1={haut}
        couleur={palette.maison_paula_murs}
        recul={DEVANT}
        aretes
      />
      <Rect
        y0={arr.y0}
        y1={arr.y1}
        z0={pl.z}
        z1={haut}
        couleur={palette.maison_paula_murs}
        recul={DEVANT}
        aretes
      />
      <Rect
        y0={fac.y1}
        y1={arr.y0}
        z0={pl.z - pl.epaisseur}
        z1={pl.z}
        couleur={palette.beton}
        recul={DEVANT}
        aretes
      />
      <Line
        points={[
          [COUPE_X - DEVANT, haut, fac.y0],
          [COUPE_X - DEVANT, haut + m.faitage, yc],
          [COUPE_X - DEVANT, haut, arr.y1],
        ]}
        color={palette.encre}
        lineWidth={1.5}
      />
    </group>
  )
}

/** Maison voisine coupée (capuchon plein) : murs et pignon du toit. */
function VoisineCoupee() {
  const v = elementParId(1) as ElementMaison
  const haut = v.z0 + v.hauteur_murs
  const yc = (v.y0 + v.y1) / 2
  return (
    <group>
      <Rect
        y0={v.y0}
        y1={v.y1}
        z0={v.z0}
        z1={haut}
        couleur={palette.maison_voisine_murs}
        recul={MILIEU}
        aretes
      />
      <Profil
        points={[
          [v.y0, haut],
          [v.y1, haut],
          [yc, haut + v.faitage],
        ]}
        couleur={palette.maison_voisine_toit}
        recul={MILIEU}
      />
    </group>
  )
}

/** Côté voisins : remblai, mur (décalé pour élargir l'espace de 3 cm), espace. */
function CoteVoisins() {
  const { mur, remblai, espace_3cm: esp } = ss.cote_voisins
  const murY0 = mur.y0 - ELARGI
  const murY1 = mur.y1 - ELARGI
  return (
    <group>
      <Rect
        y0={-17}
        y1={murY0}
        z0={remblai.z0}
        z1={remblai.z1}
        texture={textureHachures()}
        recul={FOND}
        aretes
      />
      <Rect
        y0={murY0}
        y1={murY1}
        z0={mur.z0}
        z1={mur.z1}
        couleur={palette.mur_voisins}
        recul={DEVANT}
        aretes
      />
      <Rect
        y0={murY1}
        y1={esp.y1}
        z0={mur.z0}
        z1={mur.z1}
        couleur={palette.eau_clair}
        recul={DEVANT}
        opacite={0.5}
      />
    </group>
  )
}

/** Étiquettes de la coupe : toujours (etapes absent) ou seulement pour certaines étapes. */
const ETIQUETTES: { texte: string; position: Point3; etapes?: number[] }[] = [
  { texte: 'regard', position: [COUPE_X, ss.regard.centre[1], ss.regard.z1 + 0.45] },
  {
    texte: 'deux WC',
    position: [COUPE_X, (ss.wc[0]!.position[1] + ss.wc[1]!.position[1]) / 2, 1.55],
  },
  { texte: 'vide sanitaire', position: [COUPE_X, 4, -0.45] },
  {
    texte: 'électricité, gaz',
    position: [COUPE_X, ss.electricite_gaz.position[1], ss.electricite_gaz.z + 0.65],
  },
  { texte: 'remblai, terre argileuse', position: [COUPE_X, -4.6, 0.4], etapes: [0, 1, 2] },
  { texte: 'mur des voisins', position: [COUPE_X, -1.2, RZ + 0.6], etapes: [2, 3] },
  { texte: 'espace d’environ 3 cm (élargi)', position: [COUPE_X, -0.1, -2.4], etapes: [3] },
  { texte: 'fondation de la façade', position: [COUPE_X, 0.6, -1.75], etapes: [4] },
  {
    texte: 'trou de la fondation',
    position: [COUPE_X, ss.trou_fondation_arriere.y, -1.5],
    etapes: [6],
  },
  { texte: 'humidité dans les murs', position: [COUPE_X, 2, 3.2], etapes: [9] },
]

/** Parcourt la scène sans descendre dans les groupes marqués « sansCoupe ». */
function parcourir(o: Object3D, f: (o: Object3D) => void) {
  if (o.userData.sansCoupe) return
  f(o)
  for (const c of o.children) parcourir(c, f)
}

/** Applique le plan de coupe à tous les matériaux de la scène, sauf ceux de la coupe. */
function Coupe({ active }: { active: boolean }) {
  useFrame(({ gl, scene: racine }) => {
    gl.localClippingEnabled = true
    const plans = active ? PLANS : null
    parcourir(racine, (o) => {
      if (!(o as Mesh).material) return
      const mats = ([] as Material[]).concat((o as Mesh).material as Material | Material[])
      for (const m of mats) {
        if (m.clippingPlanes === plans) continue
        m.clippingPlanes = plans
        m.needsUpdate = true
      }
    })
  })
  return null
}

export function Underground() {
  const mode = useStore((s) => s.mode)
  const etape = useStore((s) => s.etapeSous)
  const actif = mode === 'sous'
  const [arr, fac] = ss.fondations
  const trou = ss.trou_fondation_arriere
  const vs = ss.vide_sanitaire
  const col = ss.collecteur
  return (
    <>
      <Coupe active={actif} />
      {actif && (
        <group userData={{ sansCoupe: true }}>
          <Rect y0={-17} y1={14} z0={-6} z1={0} texture={textureGrains()} recul={FOND} aretes />
          <CoteVoisins />
          <VoisineCoupee />
          <Rect
            y0={vs.y0}
            y1={vs.y1}
            z0={vs.z0}
            z1={vs.z1}
            couleur={palette.papier}
            recul={MILIEU}
          />
          {[arr!, fac!].map((f) => (
            <Rect
              key={f.nom}
              y0={f.y0}
              y1={f.y1}
              z0={f.z0}
              z1={f.z1}
              texture={textureMoellons()}
              recul={DEVANT}
              aretes
            />
          ))}
          <Rect
            y0={trou.y - trou.largeur / 2}
            y1={trou.y + trou.largeur / 2}
            z0={trou.z - trou.hauteur / 2}
            z1={trou.z + trou.hauteur / 2}
            couleur={palette.encre}
            recul={DETAIL}
          />
          <Rect
            y0={col.a[1]}
            y1={col.de[1]}
            z0={col.de[2] - col.diametre / 2}
            z1={col.de[2] + col.diametre / 2}
            couleur={palette.beton_fonce}
            recul={DETAIL}
            aretes
          />
          <MaisonCoupee />
          <Regard />
          {ss.wc.map((w) => (
            <Wc key={w.nom} y={w.position[1]} z={w.z} />
          ))}
          <Rect
            y0={ss.electricite_gaz.position[1] - 0.18}
            y1={ss.electricite_gaz.position[1] + 0.18}
            z0={ss.electricite_gaz.z - 0.25}
            z1={ss.electricite_gaz.z + 0.25}
            couleur={palette.maison_voisine_murs}
            recul={DETAIL}
            aretes
          />
          {etape >= INDEX_NAPPE && (
            <Rect
              y0={vs.y0}
              y1={vs.y1}
              z0={vs.z0}
              z1={nappe.z}
              couleur={palette.eau_clair}
              recul={NAPPE}
              opacite={0.75}
            />
          )}
          <FiletEau courant={etape} />
          {ETIQUETTES.filter((e) => !e.etapes || e.etapes.includes(etape)).map((e) => (
            <Etiquette key={e.texte} position={e.position} texte={e.texte} />
          ))}
          {ss.points_interrogation.points.map((p) => (
            <Interrogation key={p.nom} position={p.position} nom={p.nom} />
          ))}
        </group>
      )}
    </>
  )
}

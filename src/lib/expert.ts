import {
  elementParId,
  elementsDeType,
  scene,
  type ElementMaison,
  type Point2,
  type Point3,
} from '../data/scene'
import { lire, ecrire } from './stockage'

// Mode « Vérifications de l'expert » : les 6 points de scene-spec.json, chacun rattaché
// à la zone de la scène qu'il concerne (02_PROMPT, étape 7). Les zones sont tirées de la géométrie.

export const VERIFS = scene.verifications_expert

/** Zone montrée dans la scène pour chaque vérification (même ordre que la spécification). */
export const ZONES = [
  'le regard',
  'la façade',
  'le remblai',
  'le pied du mur',
  'le toit voisin',
  'la maison de Paula',
  'les arbres',
]

function boite(m: ElementMaison, zHaut = m.z0 + m.hauteur_murs + m.faitage): Point3[] {
  return [m.x0, m.x1].flatMap((x) =>
    [m.y0, m.y1].flatMap((y) => [m.z0, zHaut].map((z): Point3 => [x, y, z])),
  )
}

const maisonPaula = () => elementParId(11) as ElementMaison
const maisonVoisine = () => elementParId(1) as ElementMaison
const murPoints = () => (elementParId(2) as unknown as { points: Point2[] }).points

/** Zone de la scène (points du plan) pour la vérification i (0 à 5). */
export function zoneVerif(i: number): Point3[] {
  switch (i) {
    case 0: {
      // Canalisation : le regard.
      const { centre, cote, z0, z1 } = scene.sous_sol.regard
      const [cx, cy] = centre
      const r = cote / 2 + 1.5
      return [
        [cx - r, cy - r, z0],
        [cx + r, cy + r, z1 + 1],
      ]
    }
    case 1: {
      // Fondation : la façade de la maison de Paula côté voisins.
      const m = maisonPaula()
      return [
        [m.x0, m.y0, -0.6],
        [m.x1, m.y0, -0.6],
        [m.x0, m.y0, 2.5],
        [m.x1, m.y0, 2.5],
      ]
    }
    case 2: {
      // Test au colorant : le remblai, entre la maison voisine et le mur.
      const z = scene.sols.terrain_voisins_rehausse.z
      const pts = murPoints().map(([x, y]): Point3 => [x, y, z])
      return [...pts, [...elementParId(3).ancre]]
    }
    case 3: {
      // Drainage : le pied du mur des voisins.
      const pts = murPoints()
      return pts.flatMap(([x, y]): Point3[] => [
        [x, y, 0],
        [x, y, 1.4],
      ])
    }
    case 4: {
      // Gouttières : le toit de la maison voisine, de l'égout au faîtage.
      const m = maisonVoisine()
      const egout = m.z0 + m.hauteur_murs
      return boite(m).map(([x, y, z]): Point3 => [x, y, z === m.z0 ? egout : z])
    }
    case 6: {
      // Racines : les arbres des voisins et de Paula, près des fondations (au sol).
      const rangee = (elementParId(7) as unknown as { positions: Point2[] }).positions
      const bambous = elementsDeType('bambous').flatMap((b) => b.positions)
      return [...rangee, ...bambous].flatMap(([x, y]): Point3[] => [
        [x, y, -0.5],
        [x, y, 3],
      ])
    }
    default:
      // Humidité, électricité et gaz : la maison de Paula.
      return boite(maisonPaula())
  }
}

/** Point où poser l'étiquette de la zone : au-dessus du regard (enterré, tracé au sol), au centre de la zone sinon. */
export function repereVerif(i: number): Point3 {
  if (i === 0) {
    const [cx, cy] = scene.sous_sol.regard.centre
    return [cx, cy, 1.6]
  }
  if (i === 6) {
    // Racines : au pied de la rangée de tilleuls, entre le mur et la maison de Paula.
    const rangee = (elementParId(7) as unknown as { positions: Point2[] }).positions
    const [x, y] = rangee[Math.floor(rangee.length / 2)]!
    return [x, y, 2.2]
  }
  const z = zoneVerif(i)
  const s = z.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0])
  return [s[0] / z.length, s[1] / z.length, s[2] / z.length]
}

const CLE = 'schema3d.verifications'

/** Cases cochées mémorisées (indices), en ignorant toute valeur illisible. */
export function lireCoches(): number[] {
  try {
    const v: unknown = JSON.parse(lire(CLE) ?? '[]')
    if (!Array.isArray(v)) return []
    return v.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < VERIFS.length)
  } catch {
    return []
  }
}

export function ecrireCoches(coches: number[]): void {
  ecrire(CLE, JSON.stringify([...new Set(coches)].sort((a, b) => a - b)))
}

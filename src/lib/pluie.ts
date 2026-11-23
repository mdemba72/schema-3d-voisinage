import {
  elementParId,
  scene,
  type ElementBoites,
  type ElementDalle,
  type ElementMaison,
  type LettreEtape,
  type Point2,
  type Point3,
} from '../data/scene'
import { pointDansPolygone } from './geom'

// Effets d'eau du mode « Quand il pleut ». Toutes les positions viennent de scene-spec.json :
// toits, dalle, remblai, flèches de la vue d'ensemble, ancien écoulement et trajets A à J.
// Les seuls réglages ici sont visuels : nombre de gouttes, vitesses, hauteur de chute.

export interface Trajet {
  points: Point3[]
  couleur: 'eau' | 'boue'
  /** Le premier segment est une chute de pluie (plus rapide, goutte étirée). */
  chute: boolean
  /** Vitesse d'écoulement en m/s (la chute va plus vite). */
  vitesse: number
  /** Décalage de départ entre 0 et 1. */
  phase: number
}

export interface EffetEtape {
  trajets: Trajet[]
  /** Gouttes visibles à travers le sol (étapes souterraines), comme la nappe. */
  traverse: boolean
  /** Points que la caméra doit cadrer. */
  cadrage: Point3[]
  /** Points d'interrogation (destination inconnue). */
  interrogations: Point3[]
  /** Afficher l'ancien écoulement (pointillés, croix, « tracé supposé »). */
  ancienEcoulement: boolean
}

const HAUTEUR_CHUTE = 6
const VITESSE_ECOULEMENT = 1.4
const VITESSE_CAPILLARITE = 0.45
export const MAX_GOUTTES = 300

/** Générateur pseudo-aléatoire déterministe (mêmes gouttes à chaque visite). */
export function aleatoire(graine: number) {
  let a = graine >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const entre = (r: () => number, a: number, b: number) => a + (b - a) * r()

function bornes(poly: Point2[]) {
  const xs = poly.map((p) => p[0])
  const ys = poly.map((p) => p[1])
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
}

/** Point tiré au hasard dans un polygone (rejet dans le rectangle englobant). */
function pointDans(r: () => number, poly: Point2[]): Point2 {
  const b = bornes(poly)
  for (let k = 0; k < 200; k++) {
    const p: Point2 = [entre(r, b.x0, b.x1), entre(r, b.y0, b.y1)]
    if (pointDansPolygone(p, poly)) return p
  }
  return poly[0]!
}

/** Hauteur du toit à deux pans (faîtage parallèle à x) au point d'ordonnée y. */
export function hauteurToit(m: ElementMaison, y: number): number {
  const ym = (m.y0 + m.y1) / 2
  const demi = Math.abs(m.y1 - m.y0) / 2
  return m.z0 + m.hauteur_murs + m.faitage * (1 - Math.min(1, Math.abs(y - ym) / demi))
}

/** Trajet d'une étape A à J, déplacé à l'abscisse x (la coupe de la spécification est à x = 4,5). */
function trajetLettre(lettres: LettreEtape[], x: number): Point3[] {
  const pts: Point3[] = []
  for (const l of lettres) {
    const e = scene.parcours_eau_sous_la_maison.find((p) => p.etape === l)!
    for (const [, y, z] of e.trajet) {
      const der = pts[pts.length - 1]
      if (!der || der[1] !== y || der[2] !== z) pts.push([x, y, z])
    }
  }
  return pts
}

function goutte(points: Point3[], r: () => number, opts: Partial<Trajet> = {}): Trajet {
  return { points, couleur: 'eau', chute: false, vitesse: VITESSE_ECOULEMENT, phase: r(), ...opts }
}

function pluieSur(x: number, y: number, z: number): Point3[] {
  return [
    [x, y, z + HAUTEUR_CHUTE],
    [x, y, z],
  ]
}

/** Effet de l'étape n (1 à 7) du parcours de la pluie. */
export function effetEtape(n: number): EffetEtape {
  const r = aleatoire(n * 7919)
  const vide: EffetEtape = {
    trajets: [],
    traverse: false,
    cadrage: [],
    interrogations: [],
    ancienEcoulement: false,
  }
  const maisonV = elementParId(1) as ElementMaison
  const dalle = elementParId(4) as ElementDalle
  const boites = (elementParId(5) as ElementBoites).boites
  const fleches = scene.fleches_eau_vue_ensemble
  const rz = scene.constantes.RZ

  switch (n) {
    case 1: {
      // Le toit des voisins : la pluie tombe sur les deux pans et glisse vers les gouttières.
      const m = maisonV
      const ym = (m.y0 + m.y1) / 2
      const zG = m.z0 + m.hauteur_murs
      const trajets = Array.from({ length: 200 }, () => {
        const x = entre(r, m.x0 + 0.3, m.x1 - 0.3)
        const y = entre(r, m.y0 + 0.3, m.y1 - 0.3)
        const bord = y < ym ? m.y0 : m.y1
        return goutte([...pluieSur(x, y, hauteurToit(m, y)), [x, bord, zG]], r, { chute: true })
      })
      return {
        ...vide,
        trajets,
        cadrage: [
          [m.x0, m.y0, m.z0],
          [m.x1, m.y1, m.z0],
          [m.x0, m.y1, zG + m.faitage],
          [m.x1, m.y0, zG + m.faitage],
        ],
        // Destination des descentes d'eau inconnue : point d'interrogation au bord du toit côté Paula.
        interrogations: [[(m.x0 + m.x1) / 2, m.y1, zG - 0.6]],
      }
    }
    case 2: {
      // Les surfaces en béton : l'eau ruisselle vers la limite (flèche de la dalle).
      const [de, a] = fleches[0]!
      const dx = a[0] - de[0]
      const dy = a[1] - de[1]
      const trajets: Trajet[] = []
      for (let k = 0; k < 150; k++) {
        const [x, y] = pointDans(r, dalle.polygone)
        trajets.push(
          goutte([...pluieSur(x, y, dalle.z), [x + dx, y + dy, dalle.z]], r, { chute: true }),
        )
      }
      for (let k = 0; k < 70; k++) {
        const b = boites[k % boites.length]!
        const x = entre(r, b.x0 + 0.1, b.x1 - 0.1)
        const y = entre(r, b.y0 + 0.1, b.y1 - 0.1)
        const haut = b.z0 + b.hauteur
        trajets.push(
          goutte([...pluieSur(x, y, haut), [x, b.y1 + 0.05, haut], [x, b.y1 + 0.05, dalle.z]], r, {
            chute: true,
          }),
        )
      }
      return {
        ...vide,
        trajets,
        cadrage: [
          ...dalle.polygone.map(([x, y]) => [x, y, dalle.z] as Point3),
          ...boites.map((b) => [b.x1, b.y0, b.z0 + b.hauteur] as Point3),
        ],
      }
    }
    case 3: {
      // Le remblai : l'eau s'infiltre et descend vers le point bas, le pied du mur côté Paula.
      const xs = fleches.slice(1, 4).map((f) => f[0][0])
      const yDepart = Math.min(...fleches.slice(1, 4).map((f) => f[0][1]))
      const yFin = Math.max(...fleches.slice(1, 4).map((f) => f[1][1]))
      const x0 = Math.min(...xs) - 2
      const x1 = Math.max(...xs) + 2
      const trajets = Array.from({ length: 200 }, () => {
        const x = entre(r, x0, x1)
        const y = entre(r, yDepart - 1, yFin)
        return goutte([...pluieSur(x, y, rz), [x, yFin + 0.9, rz + 0.02]], r, { chute: true })
      })
      return {
        ...vide,
        trajets,
        cadrage: [
          [x0, yDepart - 1, rz],
          [x1, yDepart - 1, rz],
          [x0, -0.3, 0],
          [x1, -0.3, 0],
        ],
      }
    }
    case 4: {
      // L'ancien écoulement : l'eau suivait ce chemin, désormais interrompu (croix).
      const anc = scene.ancien_ecoulement
      const [d] = anc.trajet
      const trajets = Array.from({ length: 70 }, () => {
        const ecart = entre(r, -0.25, 0.25)
        return goutte(
          [
            [d![0], d![1] + ecart, d![2] + 0.03],
            [anc.croix[0], anc.croix[1] + ecart, anc.croix[2] + 0.03],
          ],
          r,
          { vitesse: VITESSE_ECOULEMENT * 0.7 },
        )
      })
      return {
        ...vide,
        trajets,
        cadrage: [...anc.trajet, anc.croix, [13.2, -0.3, scene.constantes.hauteur_mur_voisins]],
        ancienEcoulement: true,
      }
    }
    case 5: {
      // Le pied du mur : l'eau s'accumule puis descend dans l'espace de 3 cm (trajets B, C, D).
      const trajets = Array.from({ length: 220 }, () =>
        goutte(trajetLettre(['B', 'C', 'D'], entre(r, 0.6, 8.4)), r, { vitesse: 1.1 }),
      )
      return {
        ...vide,
        trajets,
        traverse: true,
        cadrage: [
          [0, -3, rz],
          [9, -3, rz],
          [0, 0.4, -1.1],
          [9, 0.4, -1.1],
        ],
      }
    }
    case 6: {
      // Sous la maison : fondations, vide sanitaire, puis terre et graviers vers le regard.
      const ss = scene.sous_sol
      const eau = Array.from({ length: 170 }, () =>
        goutte(trajetLettre(['E', 'F'], entre(r, 0.8, 8.2)), r, { vitesse: 0.9 }),
      )
      const boue = Array.from({ length: 60 }, () =>
        goutte(trajetLettre(['G', 'H'], ss.plan_de_coupe_x + entre(r, -0.25, 0.25)), r, {
          couleur: 'boue',
          vitesse: 0.7,
        }),
      )
      const [cx, cy] = ss.regard.centre
      return {
        ...vide,
        trajets: [...eau, ...boue],
        traverse: true,
        cadrage: [
          [0, -0.3, 0.25],
          [9, -0.3, 0.25],
          [0, 8.05, -1.2],
          [9, 8.05, -1.2],
          [cx, cy + ss.regard.cote, ss.regard.z0],
        ],
      }
    }
    case 7: {
      // Dans les murs : remontée capillaire, lente (trajet J le long des murs).
      const p = elementParId(11) as ElementMaison
      const trajets = Array.from({ length: 160 }, () =>
        goutte(trajetLettre(['J'], entre(r, p.x0 + 0.3, p.x1 - 0.3)), r, {
          vitesse: VITESSE_CAPILLARITE,
        }),
      )
      return {
        ...vide,
        trajets,
        traverse: true,
        cadrage: [
          [p.x0, p.y0, -0.6],
          [p.x1, p.y1, -0.6],
          [p.x0, p.y1, p.z0 + p.hauteur_murs],
          [p.x1, p.y0, p.z0 + p.hauteur_murs],
        ],
      }
    }
    default:
      return vide
  }
}

/** Durées de chaque segment d'un trajet (s). */
export function durees(t: Trajet, vitesseChute = 9): number[] {
  return t.points.slice(1).map((b, i) => {
    const a = t.points[i]!
    const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
    return l / (t.chute && i === 0 ? vitesseChute : t.vitesse)
  })
}

/** Position le long du trajet à l'instant s (en boucle), et indice du segment. */
export function positionA(
  t: Trajet,
  ds: number[],
  s: number,
): { p: Point3; segment: number; progres: number } {
  const total = ds.reduce((a, b) => a + b, 0) || 1
  let reste = (((s / total + t.phase) % 1) + 1) % 1
  const progres = reste
  reste *= total
  for (let i = 0; i < ds.length; i++) {
    const d = ds[i]!
    if (reste <= d || i === ds.length - 1) {
      const k = d > 0 ? Math.min(1, reste / d) : 1
      const a = t.points[i]!
      const b = t.points[i + 1]!
      return {
        p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k],
        segment: i,
        progres,
      }
    }
    reste -= d
  }
  return { p: t.points[0]!, segment: 0, progres }
}

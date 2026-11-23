import { scene, type Point3 } from '../data/scene'

// Mode « Sous la maison » : parcours A à J de scene-spec.json, le long du plan de coupe.

export const ETAPES_SOUS = scene.parcours_eau_sous_la_maison
export const COUPE_X = scene.sous_sol.plan_de_coupe_x

/** Longueur cumulée d'une polyligne, point par point (0 au départ). */
export function longueursCumulees(points: Point3[]): number[] {
  const l = [0]
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    l.push(l[i - 1]! + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]))
  }
  return l
}

/** Point situé à la fraction f (0 à 1) de la longueur d'une polyligne. */
export function pointSur(points: Point3[], f: number): Point3 {
  const l = longueursCumulees(points)
  const total = l[l.length - 1]!
  const cible = Math.min(1, Math.max(0, f)) * total
  for (let i = 1; i < points.length; i++) {
    if (cible <= l[i]! || i === points.length - 1) {
      const a = points[i - 1]!
      const b = points[i]!
      const seg = l[i]! - l[i - 1]!
      const k = seg > 0 ? (cible - l[i - 1]!) / seg : 0
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
    }
  }
  return points[0]!
}

/**
 * Marges de cadrage autour d'un trajet (m) : plus large vers le haut, pour garder la maison
 * et le terrain dans l'image plutôt que la terre profonde.
 */
const MARGE = 1.2
const MARGE_BAS = 0.8
const MARGE_HAUT = 2

/** Points à cadrer pour l'étape i (0 = A) : son trajet, élargi d'une marge. */
export function cadrageEtapeSous(i: number): Point3[] {
  const t = ETAPES_SOUS[i]!.trajet
  return t.flatMap(([x, y, z]) => [
    [x, y - MARGE, z - MARGE_BAS],
    [x, y + MARGE, z + MARGE_HAUT],
  ])
}

/**
 * Cadrage d'ensemble de la coupe : du remblai (début du trajet A) au regard,
 * du fond du regard au faîtage de la maison de Paula.
 */
export function cadrageCoupe(): Point3[] {
  const { regard } = scene.sous_sol
  const ys = ETAPES_SOUS.flatMap((e) => e.trajet.map((p) => p[1]))
  const yMin = Math.min(...ys)
  const yMax = regard.centre[1] + regard.cote / 2
  return [
    [COUPE_X, yMin, regard.z0],
    [COUPE_X, yMax, regard.z0],
    [COUPE_X, yMin, 3],
    [COUPE_X, yMax, 3],
  ]
}

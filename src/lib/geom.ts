import { BufferGeometry, ExtrudeGeometry, Shape, ShapeGeometry, Vector2, Vector3 } from 'three'
import type { Point2 } from '../data/scene'

/**
 * Forme 2D d'un polygone du plan. On place (x, -y) dans le plan de la forme,
 * puis une rotation de -90° autour de X l'amène au sol : (x, -y, w) devient
 * Three (x, w, y). C'est une vraie rotation, l'orientation des faces est conservée.
 */
export function formePlan(points: Point2[]): Shape {
  return new Shape(points.map(([x, y]) => new Vector2(x, -y)))
}

/** Polygone plat posé à la hauteur z (repère du plan). */
export function solPlan(points: Point2[], z: number): BufferGeometry {
  const g = new ShapeGeometry(formePlan(points))
  g.rotateX(-Math.PI / 2)
  g.translate(0, z, 0)
  return g
}

/** Polygone extrudé verticalement, de z0 à z0 + hauteur (repère du plan). */
export function extrusionPlan(points: Point2[], z0: number, hauteur: number): ExtrudeGeometry {
  const g = new ExtrudeGeometry(formePlan(points), { depth: hauteur, bevelEnabled: false })
  g.rotateX(-Math.PI / 2)
  g.translate(0, z0, 0)
  return g
}

/**
 * Prisme triangulaire d'un toit à deux pans, faîtage parallèle à x.
 * Groupe 0 (pignons) et groupe 1 (pans) : deux matériaux possibles.
 */
export function toitDeuxPans(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  zBase: number,
  faitage: number,
): ExtrudeGeometry {
  const ym = (y0 + y1) / 2
  // Profil dans le plan (a, b) = (-y, hauteur), extrudé le long de x.
  const profil = new Shape()
  profil.moveTo(-y0, 0)
  profil.lineTo(-y1, 0)
  profil.lineTo(-ym, faitage)
  profil.closePath()
  const g = new ExtrudeGeometry(profil, { depth: x1 - x0, bevelEnabled: false })
  // Rotation de +90° autour de Y : (a, b, w) devient (w, b, -a) = (x, hauteur, y).
  g.rotateY(Math.PI / 2)
  g.translate(x0, zBase, 0)
  return g
}

/** Test pair-impair : le point est-il dans le polygone ? */
export function pointDansPolygone([px, py]: Point2, poly: Point2[]): boolean {
  let dedans = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!
    const [xj, yj] = poly[j]!
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) dedans = !dedans
  }
  return dedans
}

/**
 * Distance de caméra qui fait tenir tous les points dans le champ, la cible au centre.
 * direction : vecteur de la cible vers la caméra. fov vertical en degrés.
 */
export function distanceCadrage(
  points: Vector3[],
  cible: Vector3,
  direction: Vector3,
  fovDeg: number,
  aspect: number,
  marge = 1.05,
): number {
  const arriere = direction.clone().normalize()
  const droite = new Vector3(0, 1, 0).cross(arriere).normalize()
  const haut = arriere.clone().cross(droite).normalize()
  const tanV = Math.tan((fovDeg * Math.PI) / 360)
  const tanH = tanV * aspect
  let d = 0
  for (const p of points) {
    const r = p.clone().sub(cible)
    const avant = r.dot(arriere) // vers la caméra
    const besoin = Math.max(
      (Math.abs(r.dot(droite)) * marge) / tanH,
      (Math.abs(r.dot(haut)) * marge) / tanV,
    )
    d = Math.max(d, besoin + avant)
  }
  return d
}

/**
 * Cible et distance de caméra pour une direction donnée : la cible est décalée
 * au centre de l'emprise vue de face, puis la distance fait tenir tous les points.
 */
export function cadrer(
  points: Vector3[],
  cibleInitiale: Vector3,
  direction: Vector3,
  fovDeg: number,
  aspect: number,
  marge = 1.05,
): { cible: Vector3; distance: number } {
  const arriere = direction.clone().normalize()
  const droite = new Vector3(0, 1, 0).cross(arriere).normalize()
  const haut = arriere.clone().cross(droite).normalize()
  const rs = points.map((p) => p.clone().sub(cibleInitiale).dot(droite))
  const us = points.map((p) => p.clone().sub(cibleInitiale).dot(haut))
  const cible = cibleInitiale
    .clone()
    .addScaledVector(droite, (Math.min(...rs) + Math.max(...rs)) / 2)
    .addScaledVector(haut, (Math.min(...us) + Math.max(...us)) / 2)
  return { cible, distance: distanceCadrage(points, cible, direction, fovDeg, aspect, marge) }
}

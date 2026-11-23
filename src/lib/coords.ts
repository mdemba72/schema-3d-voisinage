import { Vector3 } from 'three'
import type { Point2, Point3 } from '../data/scene'

/**
 * Conversion du repère du plan vers Three.js (règle de scene-spec.json > conversion_threejs).
 * Plan : x à droite, y vers l'arrière de la maison de Paula, z vers le haut.
 * Three.js : Y vers le haut. (x, y, z) du plan devient Vector3(x, z, y).
 */
export function toThree([x, y, z]: Point3): Vector3 {
  return new Vector3(x, z, y)
}

/** Point du plan au sol, à la hauteur z donnée. */
export function toThree2([x, y]: Point2, z = 0): Vector3 {
  return toThree([x, y, z])
}

import { Vector3 } from 'three'
import { scene } from '../data/scene'

// Caméra par défaut : scene-spec.json > conversion_threejs.camera_par_defaut, cible (10, 2, -3).
// Ajustement pour retrouver la planche 1 : vue en diagonale (azimut 45°, élévation 37°),
// au lieu de la direction (28, 28, 37) de la spécification, trop tournée vers la voirie droite.
export const CIBLE_SPEC = new Vector3(10, 2, -3)
export const DIRECTION_PLANCHE = new Vector3(1, 1.07, 1).normalize()
export const FOV = 30

/** Emprise au sol (repère Three.js), tirée des voiries de la spécification. */
export const EMPRISE = (() => {
  const xs = scene.sols.voiries.flatMap((v) => v.polygone.map((p) => p[0]))
  const ys = scene.sols.voiries.flatMap((v) => v.polygone.map((p) => p[1]))
  return {
    min: new Vector3(Math.min(...xs), 0, Math.min(...ys)),
    max: new Vector3(Math.max(...xs), 0, Math.max(...ys)),
  }
})()

/** Mode « Sous la maison » : vue de profil, légèrement plongeante, depuis le côté x > coupe. */
export const DIRECTION_COUPE = new Vector3(1, 0.26, 0).normalize()

import type { Point3 } from '../data/scene'
import { hauteurSol } from './sol'

// Découpage des trajets « Sous la maison » selon la légende (surface ou dans le sol).
// Module séparé de sousSol.ts : il dépend de three.js (via sol.ts) et ne doit pas
// entrer dans le premier chargement.

/** Partie d'un trajet : en surface (trait plein) ou dans le sol (pointillé, supposé). */
export interface Troncon {
  points: Point3[]
  sol: boolean
}

/** Tolérance (m) : un segment posé sur le sol reste « en surface ». */
const TOLERANCE_SOL = 0.02

/**
 * Découpe un trajet selon la légende : un segment est « dans le sol » si son milieu est sous
 * le niveau du sol à cet endroit (terrain de Paula, terrain rehaussé ou dalle).
 */
export function troncons(trajet: Point3[]): Troncon[] {
  const res: Troncon[] = []
  for (let i = 1; i < trajet.length; i++) {
    const a = trajet[i - 1]!
    const b = trajet[i]!
    const m: Point3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
    const sol = m[2] < hauteurSol([m[0], m[1]]) - TOLERANCE_SOL
    const dernier = res[res.length - 1]
    if (dernier && dernier.sol === sol) dernier.points.push(b)
    else res.push({ points: [a, b], sol })
  }
  return res
}

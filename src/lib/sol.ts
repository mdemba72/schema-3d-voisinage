import { elementParId, scene, type ElementDalle, type Point2 } from '../data/scene'
import { pointDansPolygone } from './geom'

/** Hauteur du sol au point (x, y) : dalle, terrain rehaussé ou terrain de Paula. */
export function hauteurSol(p: Point2): number {
  const dalle = elementParId(4) as ElementDalle
  const rehausse = scene.sols.terrain_voisins_rehausse
  if (pointDansPolygone(p, dalle.polygone)) return dalle.z
  if (pointDansPolygone(p, rehausse.polygone)) return rehausse.z
  return scene.sols.terrain_paula.z
}

import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { scene, type Point2 } from '../data/scene'
import { cadrer, extrusionPlan, pointDansPolygone, solPlan, toitDeuxPans } from './geom'

const carre: Point2[] = [
  [0, 0],
  [2, 0],
  [2, 2],
  [0, 2],
]

describe('géométrie du plan', () => {
  it('pose un polygone du plan au sol : y du plan devient Z de Three', () => {
    const g = solPlan(carre, 0.5)
    g.computeBoundingBox()
    const b = g.boundingBox!
    expect(b.min.toArray().map((v) => +v.toFixed(6))).toEqual([0, 0.5, 0])
    expect(b.max.toArray().map((v) => +v.toFixed(6))).toEqual([2, 0.5, 2])
  })

  it('extrude le terrain rehaussé de 0 à RZ, côté voisins (Z négatif)', () => {
    const t = scene.sols.terrain_voisins_rehausse
    const g = extrusionPlan(t.polygone, 0, t.z)
    g.computeBoundingBox()
    const b = g.boundingBox!
    expect(b.min.y).toBeCloseTo(0)
    expect(b.max.y).toBeCloseTo(scene.constantes.RZ)
    expect(b.min.z).toBeCloseTo(-17)
  })

  it('le faîtage du toit est au milieu, à la bonne hauteur', () => {
    const g = toitDeuxPans(0, 0, 9, 8, 5.5, 3)
    g.computeBoundingBox()
    const b = g.boundingBox!
    expect(b.min.x).toBeCloseTo(0)
    expect(b.max.x).toBeCloseTo(9)
    expect(b.min.z).toBeCloseTo(0)
    expect(b.max.z).toBeCloseTo(8)
    expect(b.max.y).toBeCloseTo(8.5)
  })

  it('reconnaît un point dans un polygone', () => {
    expect(pointDansPolygone([1, 1], carre)).toBe(true)
    expect(pointDansPolygone([3, 1], carre)).toBe(false)
  })

  it('cadre les points : la cible est au centre, la distance est positive', () => {
    const pts = [new Vector3(-10, 0, 0), new Vector3(10, 0, 0)]
    const { cible, distance } = cadrer(pts, new Vector3(5, 0, 0), new Vector3(0, 0, 1), 30, 1)
    expect(cible.x).toBeCloseTo(0)
    expect(distance).toBeGreaterThan(10)
  })
})

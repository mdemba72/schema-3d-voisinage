import { describe, expect, it } from 'vitest'
import { toThree, toThree2 } from './coords'
import { scene } from '../data/scene'

describe('toThree', () => {
  it('place l’origine de la façade de Paula (y = 0) à Z = 0', () => {
    const v = toThree([0, 0, 0])
    expect(v.toArray()).toEqual([0, 0, 0])
  })

  it('met le sol rehaussé des voisins (z = RZ = 1,3) sur l’axe Y de Three.js', () => {
    const v = toThree([5, -3, scene.constantes.RZ])
    expect(v.x).toBe(5)
    expect(v.y).toBeCloseTo(1.3)
    expect(v.z).toBe(-3)
  })

  it('envoie l’arrière de la maison de Paula (y positif) vers Z positif', () => {
    const v = toThree2([4.5, 8], 0.25)
    expect(v.toArray()).toEqual([4.5, 0.25, 8])
  })
})

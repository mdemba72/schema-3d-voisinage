import { describe, expect, it } from 'vitest'
import { scene } from '../data/scene'
import { hauteurSol } from './sol'

describe('hauteur du sol', () => {
  it('distingue le terrain de Paula, le remblai et la dalle', () => {
    expect(hauteurSol([4.5, 4])).toBe(0)
    expect(hauteurSol([5, -10])).toBe(scene.constantes.RZ)
    expect(hauteurSol([20, -5])).toBe(1.33)
  })
})

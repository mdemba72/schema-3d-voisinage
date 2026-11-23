import { describe, expect, it } from 'vitest'
import { cranApresGeste } from './feuille'

const crans = [72, 390, 740]

describe('panneau bas', () => {
  it('va au cran le plus proche quand le geste est lent', () => {
    expect(cranApresGeste(crans, 0, 600, 0, 0.5)).toBe(2)
    expect(cranApresGeste(crans, 2, 300, 0, 0.5)).toBe(1)
  })

  it("avance d'au moins un cran sur un geste rapide", () => {
    expect(cranApresGeste(crans, 0, 120, -1, 0.5)).toBe(1)
    expect(cranApresGeste(crans, 0, 700, -1, 0.5)).toBe(2)
    expect(cranApresGeste(crans, 1, 380, 1, 0.5)).toBe(0)
  })
})

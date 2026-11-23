import { beforeEach, describe, expect, it } from 'vitest'
import { ecrireCoches, lireCoches, VERIFS, zoneVerif } from './expert'

const memoire = new Map<string, string>()
beforeEach(() => {
  memoire.clear()
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (k: string) => memoire.get(k) ?? null,
        setItem: (k: string, v: string) => void memoire.set(k, v),
      },
    },
  })
})

describe("vérifications de l'expert", () => {
  it('contient les 6 vérifications de la spécification', () => {
    expect(VERIFS).toHaveLength(6)
  })

  it('rattache chaque vérification à une zone de la scène', () => {
    for (let i = 0; i < VERIFS.length; i++) {
      const z = zoneVerif(i)
      expect(z.length).toBeGreaterThanOrEqual(2)
      for (const p of z) for (const c of p) expect(Number.isFinite(c)).toBe(true)
    }
    // Canalisation : sous le sol, au regard. Gouttières : en hauteur, côté voisins.
    expect(Math.min(...zoneVerif(0).map((p) => p[2]))).toBeLessThan(0)
    expect(Math.min(...zoneVerif(4).map((p) => p[2]))).toBeGreaterThan(5)
    expect(Math.max(...zoneVerif(4).map((p) => p[1]))).toBeLessThan(0)
  })

  it('mémorise les cases cochées et ignore une valeur illisible', () => {
    expect(lireCoches()).toEqual([])
    ecrireCoches([3, 0, 3])
    expect(lireCoches()).toEqual([0, 3])
    memoire.set('schema3d.verifications', 'pas du json')
    expect(lireCoches()).toEqual([])
    memoire.set('schema3d.verifications', '[1, 9, -1, "2"]')
    expect(lireCoches()).toEqual([1])
  })

  it('continue sans stockage', () => {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: {} })
    expect(lireCoches()).toEqual([])
    expect(() => ecrireCoches([1])).not.toThrow()
  })
})

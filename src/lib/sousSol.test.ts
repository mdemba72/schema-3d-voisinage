import { describe, expect, it } from 'vitest'
import { cadrageCoupe, cadrageEtapeSous, ETAPES_SOUS, longueursCumulees, pointSur } from './sousSol'

describe('parcours sous la maison', () => {
  it('contient les 10 étapes A à J, sur le plan de coupe', () => {
    expect(ETAPES_SOUS.map((e) => e.etape).join('')).toBe('ABCDEFGHIJ')
    for (const e of ETAPES_SOUS) for (const p of e.trajet) expect(p[0]).toBe(4.5)
  })

  it('A à F et J en eau, G à I en boue', () => {
    const boue = ETAPES_SOUS.filter((e) => e.couleur === 'boue').map((e) => e.etape)
    expect(boue).toEqual(['G', 'H', 'I'])
  })

  it('mesure et parcourt une polyligne', () => {
    const t: [number, number, number][] = [
      [0, 0, 0],
      [0, 3, 0],
      [0, 3, 4],
    ]
    expect(longueursCumulees(t)).toEqual([0, 3, 7])
    expect(pointSur(t, 0)).toEqual([0, 0, 0])
    expect(pointSur(t, 1)).toEqual([0, 3, 4])
    expect(pointSur(t, 5 / 7)).toEqual([0, 3, 2])
    expect(pointSur(t, 2)).toEqual([0, 3, 4])
  })

  it('cadre chaque étape autour de son trajet', () => {
    for (let i = 0; i < ETAPES_SOUS.length; i++) {
      const pts = cadrageEtapeSous(i)
      for (const p of ETAPES_SOUS[i]!.trajet) {
        expect(Math.min(...pts.map((q) => q[1]))).toBeLessThan(p[1])
        expect(Math.max(...pts.map((q) => q[2]))).toBeGreaterThan(p[2])
      }
    }
    expect(cadrageCoupe()).toHaveLength(4)
  })
})

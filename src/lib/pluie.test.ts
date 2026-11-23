import { describe, expect, it } from 'vitest'
import { elementParId, scene, type ElementMaison } from '../data/scene'
import { durees, effetEtape, hauteurToit, MAX_GOUTTES, positionA } from './pluie'

describe('effets de la pluie', () => {
  it('chaque étape a des gouttes (300 au plus), des points finis et un cadrage', () => {
    for (const e of scene.parcours_pluie_7_etapes) {
      const effet = effetEtape(e.n)
      expect(effet.trajets.length).toBeGreaterThan(0)
      expect(effet.trajets.length).toBeLessThanOrEqual(MAX_GOUTTES)
      expect(effet.cadrage.length).toBeGreaterThan(0)
      for (const t of effet.trajets)
        for (const p of t.points) p.forEach((v) => expect(Number.isFinite(v)).toBe(true))
    }
  })

  it('étape 1 : point d’interrogation sur les gouttières ; étape 4 : ancien écoulement', () => {
    expect(effetEtape(1).interrogations).toHaveLength(1)
    expect(effetEtape(4).ancienEcoulement).toBe(true)
    expect(effetEtape(2).ancienEcoulement).toBe(false)
  })

  it('les étapes souterraines se voient à travers le sol, avec de la boue vers le regard', () => {
    expect(effetEtape(3).traverse).toBe(false)
    expect(effetEtape(6).traverse).toBe(true)
    expect(effetEtape(6).trajets.some((t) => t.couleur === 'boue')).toBe(true)
  })

  it('le faîtage est le point haut du toit voisin', () => {
    const m = elementParId(1) as ElementMaison
    const ym = (m.y0 + m.y1) / 2
    expect(hauteurToit(m, ym)).toBeCloseTo(m.z0 + m.hauteur_murs + m.faitage)
    expect(hauteurToit(m, m.y1)).toBeCloseTo(m.z0 + m.hauteur_murs)
  })

  it('une goutte part du début du trajet et reste sur ses segments', () => {
    const t = { ...effetEtape(3).trajets[0]!, phase: 0 }
    const ds = durees(t)
    expect(positionA(t, ds, 0).p).toEqual(t.points[0])
    const fin = positionA(t, ds, ds.reduce((a, b) => a + b, 0) * 0.999)
    expect(fin.segment).toBe(t.points.length - 2)
  })
})

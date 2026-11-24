import { describe, expect, it } from 'vitest'
import { elementsReperes, scene } from './scene'

describe('scene-spec.json', () => {
  it('contient les 15 repères, numérotés de 1 à 15, chacun avec une ancre', () => {
    const ids = elementsReperes.map((e) => e.id).sort((a, b) => a - b)
    expect(ids).toEqual(Array.from({ length: 15 }, (_, i) => i + 1))
    for (const e of scene.elements) expect(e.ancre).toHaveLength(3)
  })

  it('ajoute les bambous sans pastille, dans le groupe « Chez Paula »', () => {
    const autres = scene.elements.filter((e) => e.sans_pastille)
    expect(autres.map((e) => e.nom)).toEqual(['Bambous'])
    expect(autres[0]!.groupe).toBe('paula')
  })

  it('suit les réponses de Paula : rondins de 50 cm au plus, WC 2 à l’étage', () => {
    const r = scene.elements.find((e) => e.type === 'rondins')!
    const hs = (r as { hauteurs: number[] }).hauteurs
    expect(Math.max(...hs)).toBeLessThanOrEqual(0.5)
    expect(Math.min(...hs)).toBeGreaterThanOrEqual(0.35)
    expect(scene.sous_sol.wc[1]!.z).toBe(2.8)
    expect(scene.descentes_gouttieres.voisine).toHaveLength(3)
    expect(scene.descentes_gouttieres.paula).toHaveLength(2)
  })

  it('contient le parcours A à J, les 7 étapes de pluie, 7 vérifications, 3 mentions', () => {
    expect(scene.parcours_eau_sous_la_maison.map((e) => e.etape).join('')).toBe('ABCDEFGHIJ')
    expect(scene.parcours_pluie_7_etapes).toHaveLength(7)
    expect(scene.verifications_expert).toHaveLength(7)
    expect(scene.mentions_obligatoires).toHaveLength(3)
  })

  it('n’emploie jamais de forme affirmative sur l’origine de l’eau', () => {
    const textes = JSON.stringify(scene).toLowerCase()
    expect(textes).not.toContain('l’eau vient de')
    expect(textes).not.toContain("l'eau vient de")
  })
})

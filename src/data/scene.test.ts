import { describe, expect, it } from 'vitest'
import { scene } from './scene'

describe('scene-spec.json', () => {
  it('contient les 15 repères, numérotés de 1 à 15, chacun avec une ancre', () => {
    const ids = scene.elements.map((e) => e.id).sort((a, b) => a - b)
    expect(ids).toEqual(Array.from({ length: 15 }, (_, i) => i + 1))
    for (const e of scene.elements) expect(e.ancre).toHaveLength(3)
  })

  it('contient le parcours A à J, les 7 étapes de pluie, 6 vérifications, 3 mentions', () => {
    expect(scene.parcours_eau_sous_la_maison.map((e) => e.etape).join('')).toBe('ABCDEFGHIJ')
    expect(scene.parcours_pluie_7_etapes).toHaveLength(7)
    expect(scene.verifications_expert).toHaveLength(6)
    expect(scene.mentions_obligatoires).toHaveLength(3)
  })

  it('n’emploie jamais de forme affirmative sur l’origine de l’eau', () => {
    const textes = JSON.stringify(scene).toLowerCase()
    expect(textes).not.toContain('l’eau vient de')
    expect(textes).not.toContain("l'eau vient de")
  })
})

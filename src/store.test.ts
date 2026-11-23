import { beforeEach, describe, expect, it } from 'vitest'
import { scene } from './data/scene'
import { CALQUES, calqueDe, useStore } from './store'

describe('calques et sélection', () => {
  beforeEach(() => {
    useStore.setState({
      selection: null,
      calques: { voisins: true, vegetation: true, paula: true, limite_eau: true },
    })
  })

  it('chaque repère appartient à un des 4 calques', () => {
    expect(CALQUES).toHaveLength(4)
    for (const el of scene.elements) expect(CALQUES.map((c) => c.id)).toContain(calqueDe(el.groupe))
    expect(calqueDe('limite')).toBe('limite_eau')
    expect(calqueDe('eau')).toBe('limite_eau')
  })

  it('masquer le calque du repère sélectionné le désélectionne', () => {
    useStore.getState().selectionner(8)
    useStore.getState().basculerCalque('paula')
    expect(useStore.getState().selection).toBe(8)
    useStore.getState().basculerCalque('vegetation')
    expect(useStore.getState().selection).toBeNull()
  })
})

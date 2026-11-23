import { MODES, useStore } from '../store'

// Sélecteur de mode à 4 segments. Onglet court (Q9) ; le nom complet est le titre du panneau.
export function ModeSwitch() {
  const mode = useStore((s) => s.mode)
  const choisir = useStore((s) => s.choisirMode)
  return (
    <div className="modes" role="tablist" aria-label="Modes du schéma">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          role="tab"
          id={`onglet-${m.id}`}
          aria-selected={mode === m.id}
          aria-controls="panneau"
          title={m.titre}
          className="mode"
          onClick={() => choisir(m.id)}
        >
          {m.onglet}
        </button>
      ))}
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { scene } from '../data/scene'
import { useStore } from '../store'
import { Mentions } from './Disclaimer'

// Panneau « À propos » : mentions obligatoires, limites du schéma, sources, version.
export function About() {
  const ouvrir = useStore((s) => s.ouvrirAPropos)
  const titre = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const avant = document.activeElement as HTMLElement | null
    titre.current?.focus()
    const echap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') ouvrir(false)
    }
    window.addEventListener('keydown', echap)
    return () => {
      window.removeEventListener('keydown', echap)
      avant?.focus()
    }
  }, [ouvrir])

  return (
    <div className="ecran" role="dialog" aria-modal="true" aria-labelledby="apropos-titre">
      <div className="ecran-page">
        <h1 id="apropos-titre" ref={titre} tabIndex={-1}>
          À propos de ce schéma
        </h1>
        <Mentions />
        <p className="apropos-avis">
          Ce schéma ne remplace pas l'avis d'un avocat ni le rapport d'un expert.
        </p>
        <h2>Ce qui reste à vérifier</h2>
        <ul className="apropos-liste">
          {scene.a_verifier_affiche.map((t) => (
            <li key={t}>{t}</li>
          ))}
          <li>{scene.legende_eau.racines}</li>
        </ul>
        <h2>Sources</h2>
        <ul className="apropos-liste">
          <li>Plan de 1991.</li>
          <li>Plan de 2015.</li>
          <li>Indications de Paula.</li>
        </ul>
        <h2>Version</h2>
        <p>Schéma du 22 novembre 2026, validé par Paula.</p>
        <button type="button" className="bouton-principal" onClick={() => ouvrir(false)}>
          Fermer
        </button>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { elementParId, scene } from '../data/scene'
import { cranApresGeste } from '../lib/feuille'
import { MODES, nomCalque, useStore, type Hauteur } from '../store'
import { Legend } from './Legend'
import { Pastille } from './Pastille'
import { ExpertChecklist } from './ExpertChecklist'
import { RainSteps } from './RainSteps'
import { UnderSteps } from './UnderSteps'
import { ETAPES_SOUS } from '../lib/sousSol'
import { useHauteurFenetre, useMedia } from './useMedia'

// Réglages du panneau bas (portrait) : replié 72 px, mi-hauteur, plein.
const REPLIE = 72
const PART_MI = 0.46
const ECART_PLEIN = 8
const SEUIL_GESTE = 6 // px avant de considérer un glissement
const SEUIL_VITESSE = 0.5 // px/ms pour un geste rapide
const ORDRE: Hauteur[] = ['replie', 'mi', 'plein']

function Fiche({ id }: { id: number }) {
  const el = elementParId(id)
  const selectionner = useStore((s) => s.selectionner)
  const titre = useRef<HTMLHeadingElement>(null)
  // Le focus va au titre de la fiche, pour les lecteurs d'écran et le clavier.
  useEffect(() => titre.current?.focus({ preventScroll: true }), [id])
  return (
    <article className="fiche" aria-labelledby="fiche-titre">
      <p className="fiche-groupe">
        <Pastille el={el} />
        <span className="lecteur">Repère {el.id}, </span>
        <span>{nomCalque(el.groupe)}</span>
      </p>
      <h3 id="fiche-titre" ref={titre} tabIndex={-1}>
        {el.nom}
      </h3>
      <p className="fiche-texte">{el.texte}</p>
      <button type="button" className="bouton-texte" onClick={() => selectionner(null)}>
        Revenir à la légende
      </button>
    </article>
  )
}

/** Contenu du panneau selon le mode. */
function Contenu() {
  const mode = useStore((s) => s.mode)
  const selection = useStore((s) => s.selection)
  if (mode === 'pluie') return <RainSteps />
  if (mode === 'sous') return <UnderSteps />
  if (mode === 'expert') return <ExpertChecklist />
  if (selection !== null) return <Fiche id={selection} />
  return (
    <>
      <Legend />
      <p className="panneau-mention">{scene.mentions_obligatoires[0]}</p>
    </>
  )
}

function Tete() {
  const mode = useStore((s) => s.mode)
  const selection = useStore((s) => s.selection)
  const etapePluie = useStore((s) => s.etapePluie)
  const etapeSous = useStore((s) => s.etapeSous)
  const titre = MODES.find((m) => m.id === mode)!.titre
  return (
    <div className="panneau-titre">
      <h2>{titre}</h2>
      {mode === 'vue' && selection === null && <p>Touchez un numéro pour lire sa fiche.</p>}
      {mode === 'pluie' && (
        <p>
          Étape {etapePluie} sur {scene.parcours_pluie_7_etapes.length} :{' '}
          {scene.parcours_pluie_7_etapes[etapePluie - 1]!.titre.toLowerCase()}
        </p>
      )}
      {mode === 'expert' && <p>Touchez un point pour voir la zone concernée.</p>}
      {mode === 'sous' && (
        <p className="resume-etape">
          Étape {ETAPES_SOUS[etapeSous]!.etape} : {ETAPES_SOUS[etapeSous]!.texte}
        </p>
      )}
    </div>
  )
}

function hauteurPx(h: Hauteur, fenetre: number, haut: number): number {
  if (h === 'replie') return REPLIE
  if (h === 'mi') return Math.round(fenetre * PART_MI)
  return Math.max(REPLIE, fenetre - haut - ECART_PLEIN)
}

/** Panneau bas à trois hauteurs, poignée, glissement au doigt (portrait). */
function Feuille() {
  const hauteur = useStore((s) => s.hauteur)
  const changer = useStore((s) => s.changerHauteur)
  const haut = useStore((s) => s.marges.haut)
  const fixerMarges = useStore((s) => s.fixerMarges)
  const fenetre = useHauteurFenetre()
  const [glisse, setGlisse] = useState<number | null>(null)
  const depart = useRef<{ y: number; h: number; t: number } | null>(null)
  const aGlisse = useRef(false)

  const cible = hauteurPx(hauteur, fenetre, haut)
  const affichee = glisse ?? cible

  // La scène se cadre au-dessus du panneau (mi-hauteur quand il est plein).
  useEffect(() => {
    fixerMarges({ bas: hauteurPx(hauteur === 'plein' ? 'mi' : hauteur, fenetre, haut) })
  }, [hauteur, fenetre, haut, fixerMarges])

  const debut = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    depart.current = { y: e.clientY, h: cible, t: performance.now() }
    aGlisse.current = false
  }
  const bouger = (e: PointerEvent<HTMLDivElement>) => {
    const d = depart.current
    if (!d) return
    const dy = e.clientY - d.y
    if (Math.abs(dy) > SEUIL_GESTE) aGlisse.current = true
    if (aGlisse.current)
      setGlisse(Math.min(hauteurPx('plein', fenetre, haut), Math.max(REPLIE, d.h - dy)))
  }
  const fin = (e: PointerEvent<HTMLDivElement>) => {
    const d = depart.current
    depart.current = null
    if (!d) return
    // Un simple toucher (sans glissement) bascule entre replié et mi-hauteur.
    if (!aGlisse.current) {
      basculer()
      return
    }
    const dy = e.clientY - d.y
    const vitesse = dy / Math.max(1, performance.now() - d.t)
    const i = ORDRE.indexOf(hauteur)
    const crans = ORDRE.map((o) => hauteurPx(o, fenetre, haut))
    const suivante = ORDRE[cranApresGeste(crans, i, d.h - dy, vitesse, SEUIL_VITESSE)]!
    setGlisse(null)
    changer(suivante)
  }

  function basculer() {
    changer(hauteur === 'replie' ? 'mi' : 'replie')
  }

  return (
    <aside
      id="panneau"
      className="feuille"
      data-hauteur={hauteur}
      data-glisse={glisse !== null}
      style={{ height: `calc(${affichee}px + env(safe-area-inset-bottom))` }}
      aria-label="Panneau d'information"
    >
      <div
        className="feuille-tete"
        onPointerDown={debut}
        onPointerMove={bouger}
        onPointerUp={fin}
        onPointerCancel={fin}
      >
        <button
          type="button"
          className="poignee"
          aria-expanded={hauteur !== 'replie'}
          aria-label={hauteur === 'replie' ? 'Agrandir le panneau' : 'Réduire le panneau'}
          onClick={(e) => {
            if (e.detail === 0) basculer()
          }}
        />
        <Tete />
      </div>
      <div className="feuille-corps" hidden={hauteur === 'replie' && glisse === null}>
        <Contenu />
      </div>
    </aside>
  )
}

/** Panneau à droite (paysage). */
function Colonne() {
  const fixerMarges = useStore((s) => s.fixerMarges)
  useEffect(() => fixerMarges({ bas: 0 }), [fixerMarges])
  return (
    <aside id="panneau" className="colonne" aria-label="Panneau d'information">
      <Tete />
      <Contenu />
    </aside>
  )
}

// Panneau bas en portrait, panneau à droite en paysage.
export function BottomSheet() {
  const paysage = useMedia('(orientation: landscape)')
  return paysage ? <Colonne /> : <Feuille />
}

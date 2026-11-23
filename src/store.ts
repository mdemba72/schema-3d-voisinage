import { create } from 'zustand'
import { elementParId, scene, type Groupe } from './data/scene'

/** Les 4 calques de la légende (CLAUDE.md § 6). « Limite et eau » réunit deux groupes de la spécification. */
export type Calque = 'voisins' | 'vegetation' | 'paula' | 'limite_eau'

export const CALQUES: { id: Calque; nom: string; groupes: Groupe[] }[] = [
  { id: 'voisins', nom: 'Constructions des voisins', groupes: ['voisins'] },
  { id: 'vegetation', nom: 'Végétation des voisins', groupes: ['vegetation'] },
  { id: 'paula', nom: 'Chez Paula', groupes: ['paula'] },
  { id: 'limite_eau', nom: 'Limite et eau', groupes: ['limite', 'eau'] },
]

export function calqueDe(groupe: Groupe): Calque {
  return CALQUES.find((c) => c.groupes.includes(groupe))!.id
}

export function nomCalque(groupe: Groupe): string {
  return CALQUES.find((c) => c.groupes.includes(groupe))!.nom
}

/** Les 4 modes. Onglet court à 390 px, nom complet en titre du panneau (Q9). */
export type Mode = 'vue' | 'pluie' | 'sous' | 'expert'

export const MODES: { id: Mode; onglet: string; titre: string }[] = [
  { id: 'vue', onglet: 'Vue', titre: "Vue d'ensemble" },
  { id: 'pluie', onglet: 'Pluie', titre: 'Quand il pleut' },
  { id: 'sous', onglet: 'Sous la maison', titre: 'Sous la maison' },
  { id: 'expert', onglet: 'Expert', titre: "Vérifications de l'expert" },
]

/** Hauteurs du panneau bas en portrait. */
export type Hauteur = 'replie' | 'mi' | 'plein'

interface Etat {
  mode: Mode
  /** Étape affichée du mode « Quand il pleut » (1 à 7). */
  etapePluie: number
  /** Étape affichée du mode « Sous la maison » (0 = A … 9 = J). */
  etapeSous: number
  /** Le mode « Sous la maison » a déjà été ouvert (il reste chargé ensuite). */
  sousVisite: boolean
  /** Lecture automatique des étapes A à J. */
  lecture: boolean
  /** Vérification de l'expert mise en avant (0 à 5), ou null. */
  verif: number | null
  /** Repère sélectionné (1 à 15), ou null. */
  selection: number | null
  calques: Record<Calque, boolean>
  hauteur: Hauteur
  aProposOuvert: boolean
  /** Bandes de l'écran couvertes par l'interface (px) : la scène se cadre entre elles. */
  marges: { haut: number; bas: number }
  /** Incrémenté à chaque demande « Recentrer la vue ». */
  recentrage: number
  choisirMode: (m: Mode) => void
  choisirEtapePluie: (n: number) => void
  selectionner: (id: number | null) => void
  choisirEtapeSous: (i: number) => void
  lire: (active: boolean) => void
  choisirVerif: (i: number | null) => void
  basculerCalque: (c: Calque) => void
  changerHauteur: (h: Hauteur) => void
  ouvrirAPropos: (ouvert: boolean) => void
  fixerMarges: (m: Partial<{ haut: number; bas: number }>) => void
  recentrer: () => void
}

export const useStore = create<Etat>((set) => ({
  mode: 'vue',
  etapePluie: 1,
  etapeSous: 0,
  lecture: false,
  sousVisite: false,
  verif: null,
  selection: null,
  calques: { voisins: true, vegetation: true, paula: true, limite_eau: true },
  hauteur: 'replie',
  aProposOuvert: false,
  marges: { haut: 0, bas: 0 },
  recentrage: 0,
  // Hors de la vue d'ensemble, le panneau s'ouvre à mi-hauteur pour montrer l'étape.
  choisirMode: (mode) =>
    set((s) => ({
      mode,
      selection: null,
      lecture: false,
      verif: null,
      sousVisite: s.sousVisite || mode === 'sous',
      hauteur: mode !== 'vue' && s.hauteur === 'replie' ? 'mi' : s.hauteur,
    })),
  choisirEtapePluie: (n) =>
    set({ etapePluie: Math.min(scene.parcours_pluie_7_etapes.length, Math.max(1, n)) }),
  choisirEtapeSous: (i) =>
    set({ etapeSous: Math.min(scene.parcours_eau_sous_la_maison.length - 1, Math.max(0, i)) }),
  lire: (lecture) => set({ lecture }),
  choisirVerif: (verif) => set({ verif }),
  // Ouvrir une fiche déplie le panneau à mi-hauteur s'il était replié.
  selectionner: (id) =>
    set((s) => ({
      selection: id,
      hauteur: id !== null && s.hauteur === 'replie' ? 'mi' : s.hauteur,
    })),
  changerHauteur: (hauteur) => set({ hauteur }),
  ouvrirAPropos: (aProposOuvert) => set({ aProposOuvert }),
  fixerMarges: (m) =>
    set((s) => {
      const marges = { ...s.marges, ...m }
      return marges.haut === s.marges.haut && marges.bas === s.marges.bas ? s : { marges }
    }),
  recentrer: () => set((s) => ({ selection: null, recentrage: s.recentrage + 1 })),
  basculerCalque: (c) =>
    set((s) => {
      const calques = { ...s.calques, [c]: !s.calques[c] }
      // Un repère masqué ne reste pas sélectionné.
      const masque = s.selection !== null && !calques[calqueDe(elementParId(s.selection).groupe)]
      return { calques, selection: masque ? null : s.selection }
    }),
}))

/** Le calque du groupe est-il visible ? */
export function useCalqueVisible(groupe: Groupe): boolean {
  return useStore((s) => s.calques[calqueDe(groupe)])
}

// Types de docs/scene-spec.json et export typé.
// La spécification est la seule source de vérité : aucune coordonnée en dur ailleurs.
import brut from '../../docs/scene-spec.json'

/** Point du plan [x, y] en mètres (schéma, non à l'échelle). */
export type Point2 = [number, number]
/** Point du plan [x, y, z] en mètres (schéma, non à l'échelle). */
export type Point3 = [number, number, number]

export type NomCouleur = keyof Palette

export interface Palette {
  papier: string
  encre: string
  attenue: string
  eau: string
  eau_clair: string
  boue: string
  terre: string
  terre_fonce: string
  beton: string
  beton_fonce: string
  mur_voisins: string
  mur_voisins_fonce: string
  limite: string
  vert: string
  vert_fonce: string
  haie: string
  sol_voisins: string
  sol_paula: string
  voirie: string
  maison_paula_murs: string
  maison_paula_toit: string
  maison_voisine_murs: string
  maison_voisine_toit: string
  palissade: string
}

export interface ConversionThreejs {
  _note_ancres: string
  regle: string
  camera_par_defaut: string
}

export interface Constantes {
  RZ: number
  hauteur_mur_voisins: number
  epaisseur_mur_voisins: number
  espace_facade_mur: number
}

export interface SolPolygone {
  _note?: string
  z: number
  polygone: Point2[]
}

export interface Voirie {
  nom: string
  polygone: Point2[]
}

export interface Sols {
  terrain_voisins_rehausse: SolPolygone
  terrain_paula: SolPolygone
  voiries: Voirie[]
  remblai_face_visible: {
    de: Point2
    a: Point2
    z0: number
    z1: number
    materiau: string
  }
}

export type Groupe = 'voisins' | 'vegetation' | 'paula' | 'limite' | 'eau'

interface ElementBase {
  id: number
  ancre: Point3
  groupe: Groupe
  nom: string
  texte: string
  etiquette?: string
  /** Élément sans numéro de repère : pas de pastille, fiche ouverte en touchant l'objet. */
  sans_pastille?: boolean
}

export interface ElementMaison extends ElementBase {
  type: 'maison_toit_deux_pans'
  x0: number
  y0: number
  x1: number
  y1: number
  z0: number
  hauteur_murs: number
  faitage: number
  faitage_parallele_a: 'x' | 'y'
  transparence_vue_ensemble?: number
}

export interface ElementMur extends ElementBase {
  type: 'mur_polyligne'
  epaisseur: number
  z0: number
  hauteur: number
  points: Point2[]
}

export interface ElementReferenceSol extends ElementBase {
  type: 'reference_sol'
  voir: string
}

export interface ElementDalle extends ElementBase {
  type: 'dalle'
  z: number
  epaisseur: number
  polygone: Point2[]
}

export interface Boite {
  nom: string
  x0: number
  y0: number
  x1: number
  y1: number
  z0: number
  hauteur: number
  couleur: string
}

export interface ElementBoites extends ElementBase {
  type: 'boites'
  boites: Boite[]
}

export interface ElementBoite extends ElementBase {
  type: 'boite'
  x0: number
  y0: number
  x1: number
  y1: number
  z0: number
  hauteur: number
}

export interface ElementArbres extends ElementBase {
  type: 'arbres'
  z0: number
  hauteur: number
  rayon_houppier: number
  positions: Point2[]
}

export interface ElementArbre extends ElementBase {
  type: 'arbre'
  position: Point2
  z0: number
  hauteur: number
  rayon_houppier: number
  couleur: string
}

export interface SegmentHaie {
  de: Point2
  a: Point2
  z0: number
}

export interface ElementHaies extends ElementBase {
  type: 'haies'
  segments: SegmentHaie[]
  hauteur: number
  epaisseur: number
}

export interface ElementRondins extends ElementBase {
  type: 'rondins'
  nombre: number
  x_depart: number
  pas: number
  largeur: number
  y0: number
  y1: number
  z0: number
  hauteur: number
  /** Hauteur de chaque rondin (profil irrégulier), sinon « hauteur » pour tous. */
  hauteurs?: number[]
}

export interface ElementBambous extends ElementBase {
  type: 'bambous'
  hauteur: number
  positions: Point2[]
}

export interface Borne {
  forme: 'ronde' | 'triangulaire'
  position: Point2
  z: number
}

export interface ElementLimite extends ElementBase {
  type: 'limite'
  ligne: { de: Point2; a: Point2; style: string; couleur: string }
  bornes: Borne[]
}

export interface ElementNappe extends ElementBase {
  type: 'nappe'
  centre: Point2
  z: number
  rayon_x: number
  rayon_y: number
}

export type Element =
  | ElementMaison
  | ElementMur
  | ElementReferenceSol
  | ElementDalle
  | ElementBoites
  | ElementBoite
  | ElementArbres
  | ElementArbre
  | ElementHaies
  | ElementRondins
  | ElementLimite
  | ElementNappe
  | ElementBambous

export type Fleche = [Point3, Point3]

export interface Fondation {
  nom: string
  y0: number
  y1: number
  z0: number
  z1: number
  materiau: string
}

export interface SousSol {
  _note: string
  plan_de_coupe_x: number
  fondations: Fondation[]
  trou_fondation_arriere: { y: number; z: number; largeur: number; hauteur: number }
  vide_sanitaire: { y0: number; y1: number; z0: number; z1: number }
  plancher: { z: number; epaisseur: number }
  regard: { centre: Point2; cote: number; z0: number; z1: number; contenu: string }
  collecteur: { de: Point3; a: Point3; diametre: number }
  wc: { nom: string; niveau: string; position: Point2; z: number }[]
  /** Plancher de l'étage (WC 2). */
  etage: { z: number; epaisseur: number }
  /** Descente verticale commune des deux WC vers le collecteur. */
  descente_commune: { y: number; z0: number; z1: number }
  points_interrogation: {
    _note: string
    couleur: NomCouleur
    points: { nom: string; position: Point3 }[]
  }
  electricite_gaz: { position: Point2; z: number }
  cote_voisins: {
    _note: string
    espace_3cm: { y0: number; y1: number; exagere_visuellement: boolean }
    mur: { y0: number; y1: number; z0: number; z1: number }
    remblai: { z0: number; z1: number; materiau: string }
  }
}

export type LettreEtape = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J'

export interface EtapeSousLaMaison {
  etape: LettreEtape
  couleur: 'eau' | 'boue'
  texte: string
  trajet: Point3[]
}

export interface EtapePluie {
  n: number
  titre: string
  texte: string
}

export interface AncienEcoulement {
  _note: string
  etape_pluie: number
  style: string
  mention: string
  trajet: Point3[]
  croix: Point3
}

export interface SceneSpec {
  _lisez_moi: string
  conversion_threejs: ConversionThreejs
  constantes: Constantes
  palette: Palette
  sols: Sols
  elements: Element[]
  fleches_eau_vue_ensemble: Fleche[]
  sous_sol: SousSol
  parcours_eau_sous_la_maison: EtapeSousLaMaison[]
  parcours_pluie_7_etapes: EtapePluie[]
  ancien_ecoulement: AncienEcoulement
  /** Descentes de gouttière, positions indicatives (à vérifier). */
  descentes_gouttieres: { _note: string; rayon: number; voisine: Point2[]; paula: Point2[] }
  legende_eau: { convention: string; racines: string }
  a_verifier_affiche: string[]
  verifications_expert: string[]
  mentions_obligatoires: string[]
}

// Le JSON importé est typé de façon large par TypeScript (tableaux non tuples,
// chaînes non littérales). La conversion est vérifiée par les tests de src/data/scene.test.ts.
export const scene = brut as unknown as SceneSpec

export const palette = scene.palette

/** Éléments qui ont un numéro de repère (pastille) : les 15 repères de la planche. */
export const elementsReperes = scene.elements.filter((e) => !e.sans_pastille)

/** Retourne l'élément de la spécification par son numéro (1 à 15, puis éléments sans pastille). */
export function elementParId(id: number): Element {
  const el = scene.elements.find((e) => e.id === id)
  if (!el) throw new Error(`Repère ${id} absent de scene-spec.json`)
  return el
}

/** Tous les éléments d'un type donné, typés. */
export function elementsDeType<T extends Element['type']>(
  type: T,
): Extract<Element, { type: T }>[] {
  return scene.elements.filter((e): e is Extract<Element, { type: T }> => e.type === type)
}

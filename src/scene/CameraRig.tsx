import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { PerspectiveCamera, Vector3, type Camera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { elementParId, elementsReperes, type Point3 } from '../data/scene'
import { toThree } from '../lib/coords'
import { cadrer } from '../lib/geom'
import { zoneVerif } from '../lib/expert'
import { effetEtape } from '../lib/pluie'
import { cadrageCoupe, cadrageEtapeSous } from '../lib/sousSol'
import { useStore } from '../store'
import { CIBLE_SPEC, DIRECTION_COUPE, DIRECTION_PLANCHE, EMPRISE, FOV } from './cadrage'

// Réglages du glissement vers un repère.
const DUREE_MS = 700
const RAPPROCHEMENT = 0.5

/** Points à garder à l'écran : coins des voiries au sol et ancres des 15 repères. */
function pointsACadrer(): Vector3[] {
  const { min, max } = EMPRISE
  const coins = [min.x, max.x].flatMap((x) => [min.z, max.z].map((z) => new Vector3(x, 0, z)))
  return [...coins, ...elementsReperes.map((e) => toThree(e.ancre))]
}

interface Vue {
  position: Vector3
  cible: Vector3
}

interface Marges {
  haut: number
  bas: number
}

/** Hauteur d'écran laissée à la scène entre l'en-tête et le panneau. */
function hauteurUtile(h: number, m: Marges) {
  return Math.max(120, h - m.haut - m.bas)
}

/**
 * Vue d'ensemble : toute la scène tient dans la zone utile (entre l'en-tête et le panneau).
 * Le champ vertical est réduit à la part utile de l'écran.
 */
function vueEnsemble(l: number, h: number, m: Marges): Vue & { distance: number } {
  const utile = hauteurUtile(h, m)
  const fovUtile = (2 * Math.atan(Math.tan((FOV * Math.PI) / 360) * (utile / h)) * 180) / Math.PI
  const { cible, distance } = cadrer(
    pointsACadrer(),
    CIBLE_SPEC,
    DIRECTION_PLANCHE,
    fovUtile,
    l / utile,
    1.04,
  )
  return { cible, distance, position: cible.clone().addScaledVector(DIRECTION_PLANCHE, distance) }
}

/**
 * Vue cadrée sur une zone (points du plan), dans une direction donnée (la planche par défaut).
 * Jamais plus près que la distance minimale (45 % de la vue d'ensemble par défaut).
 */
function vueZone(
  points: Point3[],
  l: number,
  h: number,
  m: Marges,
  direction = DIRECTION_PLANCHE,
  minimum = vueEnsemble(l, h, m).distance * 0.45,
): Vue & { distance: number } {
  const pts = points.map(toThree)
  const centre = pts.reduce((a, p) => a.add(p), new Vector3()).multiplyScalar(1 / pts.length)
  const utile = hauteurUtile(h, m)
  const fovUtile = (2 * Math.atan(Math.tan((FOV * Math.PI) / 360) * (utile / h)) * 180) / Math.PI
  const { cible, distance } = cadrer(pts, centre, direction, fovUtile, l / utile, 1.15)
  const d = Math.max(distance, minimum)
  return { cible, distance: d, position: cible.clone().addScaledVector(direction, d) }
}

/** Mode « Sous la maison » : vue de profil de la coupe, rapprochée sur l'étape. */
function vueSous(i: number, l: number, h: number, m: Marges): Vue {
  const ensemble = vueZone(cadrageCoupe(), l, h, m, DIRECTION_COUPE, 0)
  return vueZone(cadrageEtapeSous(i), l, h, m, DIRECTION_COUPE, ensemble.distance * 0.65)
}

/** Vue propre au mode courant (pluie, sous la maison, vérification choisie), ou null pour la vue d'ensemble. */
function vueDuMode(l: number, h: number, m: Marges): Vue | null {
  const e = useStore.getState()
  if (e.mode === 'pluie') return vueZone(effetEtape(e.etapePluie).cadrage, l, h, m)
  if (e.mode === 'sous') return vueSous(e.etapeSous, l, h, m)
  if (e.mode === 'expert' && e.verif !== null) return vueZone(zoneVerif(e.verif), l, h, m)
  return null
}

/** Vue rapprochée d'un repère, dans la direction de regard actuelle. */
function vueRepere(id: number, depuis: Vector3, cibleActuelle: Vector3, distance: number): Vue {
  const cible = toThree(elementParId(id).ancre)
  const dir = depuis.clone().sub(cibleActuelle).normalize()
  return { cible, position: cible.clone().addScaledVector(dir, distance * RAPPROCHEMENT) }
}

function placer(camera: Camera, controles: OrbitControlsImpl | null, v: Vue) {
  camera.position.copy(v.position)
  camera.lookAt(v.cible)
  if (controles) {
    controles.target.copy(v.cible)
    controles.update()
  }
}

/** Décale l'image pour centrer la scène dans la zone utile (le panneau couvre le bas). */
function decalerImage(camera: Camera, l: number, h: number, m: Marges) {
  if (!(camera instanceof PerspectiveCamera)) return
  camera.setViewOffset(l, h, 0, (m.bas - m.haut) / 2, l, h)
  camera.updateProjectionMatrix()
}

function bornerDistances(controles: OrbitControlsImpl | null, distance: number) {
  if (!controles) return
  controles.minDistance = distance * 0.2
  controles.maxDistance = distance * 1.4
}

/** Courbe douce (accélère puis ralentit). */
const douce = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

function mouvementReduit(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

interface Glissement {
  debut: number
  de: Vue
  vers: Vue
}

function avancer(g: Glissement, maintenant: number, camera: Camera, c: OrbitControlsImpl | null) {
  const t = Math.min(1, (maintenant - g.debut) / DUREE_MS)
  const k = douce(t)
  placer(camera, c, {
    position: g.de.position.clone().lerp(g.vers.position, k),
    cible: g.de.cible.clone().lerp(g.vers.cible, k),
  })
  return t < 1
}

/**
 * Cadrage de la caméra : vue d'ensemble au démarrage et au redimensionnement,
 * glissement de 700 ms vers le repère sélectionné (instantané si mouvement réduit).
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const controles = useThree((s) => s.controls) as OrbitControlsImpl | null
  const invalidate = useThree((s) => s.invalidate)
  const { width, height } = useThree((s) => s.size)
  const selection = useStore((s) => s.selection)
  const marges = useStore((s) => s.marges)
  const recentrage = useStore((s) => s.recentrage)
  const mode = useStore((s) => s.mode)
  const etapePluie = useStore((s) => s.etapePluie)
  const etapeSous = useStore((s) => s.etapeSous)
  const verif = useStore((s) => s.verif)
  const distance = useRef(0)
  const glissement = useRef<Glissement | null>(null)
  const dejaPlace = useRef(false)
  const aBouge = useRef(false)

  const glisserVers = (vers: Vue) => {
    if (!controles) return
    const de: Vue = { position: camera.position.clone(), cible: controles.target.clone() }
    if (mouvementReduit()) placer(camera, controles, vers)
    else glissement.current = { debut: performance.now(), de, vers }
    invalidate()
  }

  // Vue d'ensemble au démarrage et à chaque changement de taille.
  useEffect(() => {
    const m = useStore.getState().marges
    decalerImage(camera, width, height, m)
    const v = vueEnsemble(width, height, m)
    distance.current = v.distance
    bornerDistances(controles, v.distance)
    glissement.current = null
    const sel = useStore.getState().selection
    placer(camera, controles, sel === null ? v : vueRepere(sel, v.position, v.cible, v.distance))
    dejaPlace.current = true
    invalidate()
  }, [camera, controles, width, height, invalidate])

  // Quand l'en-tête ou le panneau change de taille : l'image est recentrée dans la zone utile.
  // Tant que l'utilisateur n'a pas bougé la vue, le cadrage d'ensemble est aussi recalculé.
  useEffect(() => {
    decalerImage(camera, width, height, marges)
    const etat = useStore.getState()
    const vm = vueDuMode(width, height, marges)
    if (!aBouge.current && vm) {
      glisserVers(vm)
    } else if (!aBouge.current && etat.selection === null && !glissement.current) {
      const v = vueEnsemble(width, height, marges)
      distance.current = v.distance
      bornerDistances(controles, v.distance)
      placer(camera, controles, v)
    }
    invalidate()
    // Seules les marges déclenchent cet effet ; la taille est gérée plus haut.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marges])

  // Un geste de l'utilisateur interrompt le glissement en cours.
  useEffect(() => {
    if (!controles) return
    const arreter = () => {
      glissement.current = null
      aBouge.current = true
    }
    controles.addEventListener('start', arreter)
    return () => controles.removeEventListener('start', arreter)
  }, [controles])

  // Glissement à chaque changement de sélection (vers le repère, ou retour à l'ensemble).
  useEffect(() => {
    if (!dejaPlace.current || !controles) return
    const m = useStore.getState().marges
    if (selection === null) {
      glisserVers(vueEnsemble(width, height, m))
      return
    }
    const d = vueEnsemble(width, height, m).distance
    glisserVers(vueRepere(selection, camera.position, controles.target, d))
    // La taille et les marges sont lues au moment du changement seulement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection])

  // « Recentrer la vue » : retour à la vue d'ensemble, même sans sélection.
  useEffect(() => {
    if (recentrage === 0) return
    aBouge.current = false
    const m = useStore.getState().marges
    glisserVers(vueDuMode(width, height, m) ?? vueEnsemble(width, height, m))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentrage])

  // Modes « Quand il pleut », « Sous la maison » et vérifications : un cadrage par étape ;
  // retour à l'ensemble en revenant à la vue.
  useEffect(() => {
    if (!dejaPlace.current) return
    const m = useStore.getState().marges
    aBouge.current = false
    const vm = vueDuMode(width, height, m)
    if (vm) glisserVers(vm)
    else if (useStore.getState().selection === null) glisserVers(vueEnsemble(width, height, m))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, etapePluie, etapeSous, verif])

  useFrame(() => {
    const g = glissement.current
    if (!g) return
    if (avancer(g, performance.now(), camera, controles)) invalidate()
    else glissement.current = null
  })

  return null
}

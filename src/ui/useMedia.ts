import { useEffect, useState } from 'react'

/** Suit une requête média (orientation, mouvement réduit…). */
export function useMedia(requete: string): boolean {
  const [ok, setOk] = useState(() => {
    try {
      return window.matchMedia(requete).matches
    } catch {
      return false
    }
  })
  useEffect(() => {
    let mq: MediaQueryList
    try {
      mq = window.matchMedia(requete)
    } catch {
      return
    }
    const suivre = () => setOk(mq.matches)
    suivre()
    mq.addEventListener('change', suivre)
    return () => mq.removeEventListener('change', suivre)
  }, [requete])
  return ok
}

/** Hauteur de la fenêtre en pixels, mise à jour au redimensionnement. */
export function useHauteurFenetre(): number {
  const [h, setH] = useState(() => window.innerHeight)
  useEffect(() => {
    const suivre = () => setH(window.innerHeight)
    window.addEventListener('resize', suivre)
    return () => window.removeEventListener('resize', suivre)
  }, [])
  return h
}

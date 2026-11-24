import type { Element } from '../data/scene'
import { tonPastille } from '../lib/pastille'

/** Pastille décorative (dans la légende et la fiche). Le numéro est lu par le texte voisin. */
export function Pastille({ el, petite = false }: { el: Element; petite?: boolean }) {
  // Élément sans numéro (bambous) : un simple point à l'encre, à la place du chiffre.
  if (el.sans_pastille) return <span className="pastille-vide" aria-hidden />
  return (
    <span
      className="pastille"
      data-ton={tonPastille(el)}
      data-taille={petite ? 'petite' : undefined}
      aria-hidden
    >
      {el.id}
    </span>
  )
}

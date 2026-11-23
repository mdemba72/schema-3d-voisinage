import { Component, type ReactNode } from 'react'
import { useStore } from '../store'

// Repli sans 3D : la planche en image, tirée de la vue d'ensemble de l'application (anonyme).
// La légende et les fiches restent disponibles en texte dans le panneau.
export function Repli2D() {
  // Entre l'en-tête et le panneau bas, comme la scène.
  const { haut, bas } = useStore((s) => s.marges)
  return (
    <figure className="repli" style={{ top: haut, bottom: bas }}>
      <figcaption role="status">
        Votre navigateur n'affiche pas la 3D. Voici la planche en image.
      </figcaption>
      <img
        src={`${import.meta.env.BASE_URL}planche.jpg`}
        alt="Vue d'ensemble du schéma : maison de Paula en bas à gauche, maison voisine en haut à droite, mur et remblai entre les deux, dalle, douche et cabanon à droite, repères numérotés de 1 à 15. Le détail de chaque repère est dans la légende."
        width={1480}
        height={1250}
      />
    </figure>
  )
}

/** Si la scène 3D échoue (contexte WebGL perdu, module non chargé), on montre la planche. */
export class GardeScene extends Component<{ children: ReactNode }, { erreur: boolean }> {
  state = { erreur: false }
  static getDerivedStateFromError() {
    return { erreur: true }
  }
  render() {
    return this.state.erreur ? <Repli2D /> : this.props.children
  }
}

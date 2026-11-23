import { Edges } from '@react-three/drei'
import { palette } from '../data/scene'
import type { ReactNode } from 'react'
import type { Groupe } from '../data/scene'
import { useCalqueVisible, useStore } from '../store'
import { RUGOSITE } from './reglages'

// Matériaux mats et arêtes fines à l'encre du « carnet de l'expert ».

interface MatProps {
  couleur: string
  opacite?: number
}

/** Matériau mat standard. Avec une opacité < 1 : transparent, sans écriture de profondeur. */
export function Mat({ couleur, opacite = 1 }: MatProps) {
  const transparent = opacite < 1
  return (
    <meshStandardMaterial
      color={couleur}
      roughness={RUGOSITE}
      metalness={0}
      transparent={transparent}
      opacity={opacite}
      depthWrite={!transparent}
    />
  )
}

/**
 * Arêtes fines à l'encre, à faible opacité. Avec un repère : contour épais et plein
 * quand ce repère est sélectionné (mise en évidence).
 */
export function Aretes({ opacite = 0.55, repere }: { opacite?: number; repere?: number }) {
  const choisi = useStore((s) => repere !== undefined && s.selection === repere)
  return (
    <Edges
      threshold={20}
      lineWidth={choisi ? 3 : 1}
      color={palette.encre}
      transparent
      opacity={choisi ? 1 : opacite}
      renderOrder={choisi ? 4 : 0}
    />
  )
}

/** Groupe d'objets affiché seulement si le calque de la légende est actif. */
export function Calque({ groupe, children }: { groupe: Groupe; children: ReactNode }) {
  const visible = useCalqueVisible(groupe)
  return <group visible={visible}>{children}</group>
}

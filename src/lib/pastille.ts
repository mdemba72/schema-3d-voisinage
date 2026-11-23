import type { Element } from '../data/scene'

/** Teinte de la pastille : 14 en rouge limite, 15 en bleu eau, les autres en encre (CLAUDE.md § 7). */
export function tonPastille(el: Element): 'encre' | 'limite' | 'eau' {
  if (el.groupe === 'limite') return 'limite'
  if (el.groupe === 'eau') return 'eau'
  return 'encre'
}

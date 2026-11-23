/**
 * Cran du panneau après un geste : le plus proche du point de relâche,
 * et au moins un cran dans le sens d'un geste rapide.
 * hauteurs : hauteurs des crans en px, du plus bas au plus haut.
 */
export function cranApresGeste(
  hauteurs: number[],
  cranDepart: number,
  hauteurRelache: number,
  vitesse: number,
  seuilVitesse: number,
): number {
  let j = 0
  hauteurs.forEach((h, k) => {
    if (Math.abs(h - hauteurRelache) < Math.abs(hauteurs[j]! - hauteurRelache)) j = k
  })
  const dernier = hauteurs.length - 1
  if (vitesse > seuilVitesse) j = Math.min(j, Math.max(0, cranDepart - 1))
  else if (vitesse < -seuilVitesse) j = Math.max(j, Math.min(dernier, cranDepart + 1))
  return j
}

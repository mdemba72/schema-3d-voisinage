// Stockage local protégé : en navigation privée ou si le stockage est bloqué, on continue sans.
export function lire(cle: string): string | null {
  try {
    return window.localStorage.getItem(cle)
  } catch {
    return null
  }
}

export function ecrire(cle: string, valeur: string): void {
  try {
    window.localStorage.setItem(cle, valeur)
  } catch {
    // stockage indisponible : sans conséquence
  }
}

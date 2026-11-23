// Détection de WebGL (création d'un contexte d'essai, sans erreur si refusé).
export function webglDisponible(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

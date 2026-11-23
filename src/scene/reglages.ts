import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { palette } from '../data/scene'

// Réglages visuels communs (pas des données de la spécification).
export const RUGOSITE = 0.9

let hachures: CanvasTexture | null = null

/** Texture de hachures obliques du remblai (terre argileuse), générée une seule fois. */
export function textureHachures(): CanvasTexture {
  if (hachures) return hachures
  const n = 64
  const toile = document.createElement('canvas')
  toile.width = n
  toile.height = n
  const ctx = toile.getContext('2d')!
  ctx.fillStyle = palette.terre
  ctx.fillRect(0, 0, n, n)
  ctx.strokeStyle = palette.terre_fonce
  ctx.lineWidth = 5
  for (let k = -n; k <= n; k += n / 2) {
    ctx.beginPath()
    ctx.moveTo(k, n)
    ctx.lineTo(k + n, 0)
    ctx.stroke()
  }
  hachures = new CanvasTexture(toile)
  hachures.wrapS = hachures.wrapT = RepeatWrapping
  // Les UV des flancs d'extrusion sont en mètres : un motif tous les 0,5 m.
  hachures.repeat.set(2, 2)
  hachures.colorSpace = SRGBColorSpace
  hachures.anisotropy = 4
  return hachures
}

const cache = new Map<string, CanvasTexture>()

/** Texture de toile 64 px répétée, dessinée une seule fois. */
function textureDessinee(
  cle: string,
  repetition: number,
  dessiner: (ctx: CanvasRenderingContext2D, n: number) => void,
): CanvasTexture {
  const deja = cache.get(cle)
  if (deja) return deja
  const n = 64
  const toile = document.createElement('canvas')
  toile.width = n
  toile.height = n
  dessiner(toile.getContext('2d')!, n)
  const t = new CanvasTexture(toile)
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(repetition, repetition)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 4
  cache.set(cle, t)
  return t
}

/** Terre sous le sol (coupe) : fond terre semé de grains plus foncés. */
export function textureGrains(): CanvasTexture {
  return textureDessinee('grains', 1, (ctx, n) => {
    ctx.fillStyle = palette.terre
    ctx.fillRect(0, 0, n, n)
    ctx.fillStyle = palette.terre_fonce
    // Grains à positions fixes (motif régulier, sans aléa).
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        const x = i * 16 + (j % 2) * 8 + 4
        const y = j * 16 + 6
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      }
  })
}

/** Moellons des fondations (coupe) : assises de pierres à joints décalés. */
export function textureMoellons(): CanvasTexture {
  return textureDessinee('moellons', 1, (ctx, n) => {
    ctx.fillStyle = palette.beton
    ctx.fillRect(0, 0, n, n)
    ctx.strokeStyle = palette.beton_fonce
    ctx.lineWidth = 3
    const h = n / 4
    for (let r = 0; r < 4; r++) {
      ctx.beginPath()
      ctx.moveTo(0, r * h)
      ctx.lineTo(n, r * h)
      ctx.stroke()
      const decal = r % 2 ? n / 2 : 0
      for (const x of [decal, decal + n / 2]) {
        ctx.beginPath()
        ctx.moveTo(x % n, r * h)
        ctx.lineTo(x % n, (r + 1) * h)
        ctx.stroke()
      }
    }
  })
}

// Icônes PNG de l'application (installation Android, écran d'accueil iPhone), tirées de public/icon.svg :
// public/icon-192.png, public/icon-512.png, public/apple-touch-icon.png (180 px).
import { readFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const svg = await readFile('public/icon.svg', 'utf8')
const nav = await chromium.launch()
try {
  for (const [nom, taille] of [
    ['icon-192.png', 192],
    ['icon-512.png', 512],
    ['apple-touch-icon.png', 180],
  ]) {
    const page = await nav.newPage({ viewport: { width: taille, height: taille } })
    await page.setContent(
      `<style>html,body{margin:0;background:#EDF1F0}svg{display:block;width:${taille}px;height:${taille}px}</style>${svg}`,
    )
    await page.screenshot({ path: `public/${nom}` })
    await page.close()
    console.log(`public/${nom}`)
  }
} finally {
  await nav.close()
}

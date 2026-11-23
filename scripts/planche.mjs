// Image de repli (sans WebGL) : la vue d'ensemble de l'application elle-même, sans l'interface,
// enregistrée dans public/planche.jpg. Générée depuis la scène, jamais depuis reference/.
// Usage : npm run build puis npm run planche (puis npm run build pour l'inclure).
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const port = 4178
const url = `http://localhost:${port}/`
const serveur = spawn(`npx vite preview --port ${port} --strictPort`, {
  stdio: 'ignore',
  shell: true,
})
let code = 0
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) break
    } catch {
      // serveur pas encore prêt
    }
    await new Promise((ok) => setTimeout(ok, 300))
  }
  const nav = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  })
  const page = await nav.newPage({
    viewport: { width: 760, height: 800 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  })
  page.setDefaultTimeout(15000)
  // Accueil déjà vu ; en-tête, panneau et bouton masqués : il ne reste que la scène et les repères.
  await page.addInitScript(() => localStorage.setItem('schema3d.accueil', 'vu'))
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.addStyleTag({
    content: '.entete,.feuille,.colonne,.recentrer{display:none!important}',
  })
  await page.setViewportSize({ width: 760, height: 801 })
  await page.waitForTimeout(4000)
  // Recadrage sur la scène (marges vides retirées).
  await page.screenshot({
    path: 'public/planche.jpg',
    type: 'jpeg',
    quality: 82,
    clip: { x: 10, y: 90, width: 740, height: 625 },
  })
  console.log('public/planche.jpg')
  await nav.close()
} catch (e) {
  console.error(String(e).split('\n')[0])
  code = 1
} finally {
  if (process.platform === 'win32')
    spawn('taskkill', ['/pid', String(serveur.pid), '/T', '/F'], { stdio: 'ignore' })
  else serveur.kill()
}
process.exitCode = code

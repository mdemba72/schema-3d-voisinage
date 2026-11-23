// Captures du mode « Quand il pleut », une par étape, en 390 × 844 (iPhone 14) :
// shots/5-pluie-<n>.png. Usage : npm run build puis node scripts/shots-pluie.mjs
// Les captures sont prises en « mouvement réduit » : gouttes figées le long du parcours
// (le rendu logiciel de Chromium est trop lent pour l'animation continue).
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const port = 4175
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
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  })
  page.setDefaultTimeout(10000)
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  await page.getByRole('button', { name: 'Voir la maison' }).click()
  await page.getByRole('tab', { name: 'Pluie' }).click()
  for (let n = 1; n <= 7; n++) {
    await page.locator(`button.etape-point >> text="${n}"`).click()
    await page.waitForTimeout(2500)
    const chemin = `shots/5-pluie-${n}.png`
    await page.screenshot({ path: chemin })
    console.log(chemin)
  }
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

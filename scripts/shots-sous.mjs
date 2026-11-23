// Captures du mode « Sous la maison », une par étape A à J, en 390 × 844 (iPhone 14) :
// shots/6-sous-<n>.png. Usage : npm run build puis node scripts/shots-sous.mjs
// Les captures sont prises en « mouvement réduit » : filet complet, particules fixes
// (le rendu logiciel de Chromium est trop lent pour l'animation continue).
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const port = 4176
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
  await page.getByRole('tab', { name: 'Sous la maison' }).click()
  for (const n of 'ABCDEFGHIJ') {
    await page.locator(`button.etape-point >> text="${n}"`).click()
    await page.waitForTimeout(2500)
    const chemin = `shots/6-sous-${n}.png`
    await page.screenshot({ path: chemin })
    console.log(chemin)
  }
  // Autres formats, à l'étape D : Pixel 7 en portrait, iPhone 14 et Pixel 7 en paysage.
  await page.locator('button.etape-point >> text="D"').click()
  for (const [nom, width, height] of [
    ['pixel7', 412, 915],
    ['iphone14-paysage', 844, 390],
    ['pixel7-paysage', 915, 412],
  ]) {
    await page.setViewportSize({ width, height })
    await page.waitForTimeout(2500)
    const chemin = `shots/6-sous-D-${nom}.png`
    await page.screenshot({ path: chemin })
    console.log(chemin)
  }
  // Retour à la vue d'ensemble : la coupe doit disparaître.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('tab', { name: 'Vue' }).click()
  await page.waitForTimeout(2500)
  await page.screenshot({ path: 'shots/6-retour-vue.png' })
  console.log('shots/6-retour-vue.png')
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

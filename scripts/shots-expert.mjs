// Captures du mode « Vérifications de l'expert » et de « À propos », en 390 × 844 (iPhone 14) :
// shots/7-expert-<n>.png (une par vérification), 7-expert-coches.png (après rechargement),
// 7-expert-<format>.png et 7-apropos.png. Usage : npm run build puis npm run shots:expert
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const port = 4177
const url = `http://localhost:${port}/`
const serveur = spawn(`npx vite preview --port ${port} --strictPort`, {
  stdio: 'ignore',
  shell: true,
})
const capture = async (page, nom) => {
  const chemin = `shots/7-${nom}.png`
  await page.screenshot({ path: chemin })
  console.log(chemin)
}
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
  await page.getByRole('tab', { name: 'Expert' }).click()
  await page.waitForTimeout(1500)
  await capture(page, 'expert')
  const boutons = page.locator('button.verif-texte')
  for (let i = 0; i < 6; i++) {
    await boutons.nth(i).click()
    await page.waitForTimeout(2000)
    await capture(page, `expert-${i + 1}`)
  }
  // Deux cases cochées, puis rechargement : elles doivent rester cochées.
  await page.locator('input.verif-case').nth(0).check()
  await page.locator('input.verif-case').nth(3).check()
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await page.getByRole('tab', { name: 'Expert' }).click()
  await page.waitForTimeout(1500)
  const coches = await page.locator('input.verif-case:checked').count()
  console.log(`cases cochées après rechargement : ${coches}`)
  await capture(page, 'expert-coches')
  for (const [nom, width, height] of [
    ['pixel7', 412, 915],
    ['iphone14-paysage', 844, 390],
    ['pixel7-paysage', 915, 412],
  ]) {
    await page.setViewportSize({ width, height })
    await page.waitForTimeout(2000)
    await capture(page, `expert-${nom}`)
  }
  await page.getByRole('button', { name: 'Tout décocher' }).click()
  console.log(`après « Tout décocher » : ${await page.locator('input.verif-case:checked').count()}`)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'À propos' }).click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: 'shots/7-apropos.png', fullPage: true })
  console.log('shots/7-apropos.png')
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

// Capture du repli sans WebGL (Chromium lancé avec la 3D désactivée), en 390 × 844 :
// shots/8-repli.png et shots/8-repli-paysage.png. Usage : npm run build puis npm run shots:repli
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const port = 4179
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
  const nav = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] })
  const page = await nav.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  const erreurs = []
  page.on('pageerror', (e) => erreurs.push(String(e)))
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Voir la maison' }).click()
  await page.waitForTimeout(1500)
  console.log(`message : ${await page.locator('.repli figcaption').textContent()}`)
  await page.screenshot({ path: 'shots/8-repli.png' })
  console.log('shots/8-repli.png')
  await page.setViewportSize({ width: 844, height: 390 })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'shots/8-repli-paysage.png' })
  console.log('shots/8-repli-paysage.png')
  console.log(`erreurs de page : ${erreurs.length}`)
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

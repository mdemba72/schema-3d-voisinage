// Captures mobiles : lance `vite preview`, ouvre la page en 390 × 844 et 412 × 915,
// portrait et paysage, et enregistre shots/<etape>-<format>.png.
// Usage : npm run shots -- <etape> [repère]   (exemple : npm run shots -- 3 2)
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const etape = process.argv[2] ?? 'x'
// Facultatif : numéro d'un repère à toucher pour une seconde capture (fiche ouverte).
const repere = process.argv[3]
const port = 4173
const url = `http://localhost:${port}/`

const formats = [
  { nom: 'iphone14', width: 390, height: 844 },
  { nom: 'pixel7', width: 412, height: 915 },
  { nom: 'iphone14-paysage', width: 844, height: 390 },
  { nom: 'pixel7-paysage', width: 915, height: 412 },
]

async function attendreServeur(delaiMs = 30000) {
  const fin = Date.now() + delaiMs
  while (Date.now() < fin) {
    try {
      const r = await fetch(url)
      if (r.ok) return
    } catch {
      // serveur pas encore prêt
    }
    await new Promise((ok) => setTimeout(ok, 300))
  }
  throw new Error(`Le serveur de prévisualisation ne répond pas sur ${url}`)
}

const serveur = spawn(`npx vite preview --port ${port} --strictPort`, {
  stdio: 'ignore',
  shell: true,
})

let code = 0
try {
  await attendreServeur()
  await mkdir('shots', { recursive: true })
  const navigateur = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  })
  for (const f of formats) {
    const page = await navigateur.newPage({
      viewport: { width: f.width, height: f.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      locale: 'fr-FR',
    })
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForSelector('canvas', { timeout: 20000 }).catch(() => {})
    await page.waitForTimeout(4000)
    // Écran d'accueil du premier lancement : capture, puis « Voir la maison ».
    const accueil = page.getByRole('button', { name: 'Voir la maison' })
    if (await accueil.isVisible().catch(() => false)) {
      const cheminAccueil = `shots/${etape}-${f.nom}-accueil.png`
      await page.screenshot({ path: cheminAccueil })
      console.log(cheminAccueil)
      await accueil.click()
      await page.waitForTimeout(1500)
    }
    const chemin = `shots/${etape}-${f.nom}.png`
    await page.screenshot({ path: chemin })
    console.log(chemin)
    if (repere) {
      await page
        .locator(`button[aria-label^="Repère ${repere} "]`)
        .click({ timeout: 8000 })
        .catch(() => console.error(`Repère ${repere} : clic impossible (pastille recouverte ?)`))
      await page.waitForTimeout(2500)
      const cheminFiche = `shots/${etape}-${f.nom}-fiche${repere}.png`
      await page.screenshot({ path: cheminFiche })
      console.log(cheminFiche)
    }
    await page.close()
  }
  await navigateur.close()
} catch (e) {
  console.error(e)
  code = 1
} finally {
  // Sous Windows, tuer l'arbre de processus lancé par npx.
  if (process.platform === 'win32')
    spawn('taskkill', ['/pid', String(serveur.pid), '/T', '/F'], { stdio: 'ignore' })
  else serveur.kill()
}
process.exitCode = code

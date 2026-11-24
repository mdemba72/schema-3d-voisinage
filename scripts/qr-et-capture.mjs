// Point de contrôle 9 : QR code de l'URL publique (docs/qr-code.png) et captures prises
// depuis l'URL publique en 390 × 844 (shots/9-public-accueil.png, shots/9-public.png).
// Usage : npm i --no-save qrcode puis node scripts/qr-et-capture.mjs
import { chromium } from '@playwright/test'
import QRCode from 'qrcode'

const url = 'https://mdemba72.github.io/schema-3d-voisinage/'
await QRCode.toFile('docs/qr-code.png', url, {
  width: 600,
  margin: 2,
  color: { dark: '#1F2A36', light: '#EDF1F0' },
})
console.log('docs/qr-code.png')

const nav = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
try {
  const page = await nav.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  })
  const erreurs = []
  page.on('pageerror', (e) => erreurs.push(String(e)))
  page.on('response', (r) => {
    if (r.status() >= 400 && !r.url().includes('adresse/inconnue'))
      erreurs.push(`${r.status()} ${r.url()}`)
  })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.screenshot({ path: 'shots/9-public-accueil.png' })
  await page.getByRole('button', { name: 'Voir la maison' }).click()
  await page.waitForTimeout(6000)
  await page.screenshot({ path: 'shots/9-public.png' })
  console.log('shots/9-public-accueil.png, shots/9-public.png')
  const robots = await page.locator('meta[name=robots]').getAttribute('content')
  console.log(`robots : ${robots} | titre : ${await page.title()}`)
  await page.goto(`${url}adresse/inconnue`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  console.log(`adresse inconnue renvoyée vers : ${page.url()}`)
  console.log(`erreurs : ${erreurs.length ? erreurs.join(' ; ') : 'aucune'}`)
} finally {
  await nav.close()
}

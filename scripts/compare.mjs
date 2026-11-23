// Planche 1 et capture 412 × 915 paysage côte à côte : shots/2-comparaison.png (local, non versionné).
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'
const img = (f) => 'data:image/png;base64,' + readFileSync(f).toString('base64')
const nav = await chromium.launch()
const p = await nav.newPage({ viewport: { width: 1600, height: 560 } })
await p.setContent(`<body style="margin:0;display:flex;gap:16px;background:#EDF1F0;align-items:center">
<img src="${img('reference/1_plan_3d_derniere_version.png')}" style="width:780px;clip-path:inset(10% 32% 8% 0);margin-right:-250px">
<img src="${img('shots/2-pixel7-paysage.png')}" style="width:800px"></body>`)
await p.waitForTimeout(400)
await p.screenshot({ path: 'shots/2-comparaison.png' })
await nav.close()

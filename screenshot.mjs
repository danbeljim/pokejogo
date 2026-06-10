import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } })

const errors = []
page.on('pageerror', e => errors.push('PAGE: ' + e.message))
page.on('console', m => {
  if (m.type() === 'error') errors.push('CONSOLE: ' + m.text())
})

await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)
await page.screenshot({ path: 'game.png' })

console.log('ERRORS:', JSON.stringify(errors, null, 2))
await browser.close()

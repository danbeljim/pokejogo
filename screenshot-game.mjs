import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } })

const errors = []
page.on('pageerror', e => errors.push('PAGE: ' + e.message))
page.on('console', m => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type().toUpperCase()}: ${m.text()}`)
})
page.on('requestfailed', r => errors.push('REQFAIL: ' + r.url() + ' ' + r.failure()?.errorText))

await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

// Get canvas bounding box
const box = await page.locator('canvas').boundingBox()
console.log('Canvas box:', box)

// Bulbasaur [Choose] is at canvas (150, 470)
const scaleX = box.width / 800
const scaleY = box.height / 600
const clickX = box.x + 150 * scaleX
const clickY = box.y + 470 * scaleY
console.log('Click at:', clickX, clickY)

await page.mouse.click(clickX, clickY)
await page.waitForTimeout(8000)
await page.screenshot({ path: 'game.png' })

console.log('ERRORS:', JSON.stringify(errors, null, 2))
await browser.close()

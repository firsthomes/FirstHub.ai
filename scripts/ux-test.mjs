import { chromium } from 'playwright'

const VIEWPORTS = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-15-pro', width: 393, height: 852 },
  { name: 'iphone-15-plus', width: 430, height: 932 },
]

const TABS = ['dashboard', 'log', 'coach', 'history']
const results = []

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  headless: true,
})

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  })
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('pageerror', e => consoleErrors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })

  await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  for (const tab of TABS) {
    if (tab !== 'dashboard') {
      const labelMap = { log: 'Add Food', coach: 'Coach', history: 'History' }
      await page.locator(`button:has-text("${labelMap[tab]}")`).first().click()
      await page.waitForTimeout(400)
    }
    await page.screenshot({
      path: `/home/user/FirstHub.ai/ux-${vp.name}-${tab}.png`,
      fullPage: false,
    })
  }

  // Open settings modal, screenshot
  await page.locator('button:has-text("Set up")').click()
  await page.waitForTimeout(500)
  await page.screenshot({
    path: `/home/user/FirstHub.ai/ux-${vp.name}-settings.png`,
    fullPage: false,
  })

  // Tap target audit
  const small = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a, input'))
    return buttons
      .map(b => {
        const r = b.getBoundingClientRect()
        return { tag: b.tagName, text: (b.textContent || '').slice(0, 30), w: r.width, h: r.height }
      })
      .filter(b => b.h > 0 && (b.h < 44 || b.w < 44))
  })

  results.push({ viewport: vp.name, errors: consoleErrors, smallTapTargets: small.length, sample: small.slice(0, 5) })
  await ctx.close()
}

await browser.close()
console.log(JSON.stringify(results, null, 2))

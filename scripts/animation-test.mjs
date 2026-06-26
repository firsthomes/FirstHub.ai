import { chromium } from 'playwright'

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  headless: true,
})
const ctx = await browser.newContext({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
})
const page = await ctx.newPage()
await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await page.waitForTimeout(400)

const checks = []

// 1. button press scale
checks.push(await page.evaluate(() => {
  const btn = document.querySelector('.phase-badge')
  if (!btn) return { name: 'button-active-scale', ok: false, reason: 'no button' }
  const styles = getComputedStyle(btn)
  return { name: 'button-active-scale', transition: styles.transition }
}))

// 2. modal animation
await page.locator('button:has-text("Set up")').click()
await page.waitForTimeout(100)
checks.push(await page.evaluate(() => {
  const m = document.querySelector('.modal-content')
  if (!m) return { name: 'modal-animation', ok: false, reason: 'no modal' }
  const styles = getComputedStyle(m)
  return { name: 'modal-animation', animation: styles.animation, hasShadow: styles.boxShadow !== 'none' }
}))

checks.push(await page.evaluate(() => {
  const o = document.querySelector('.modal-overlay')
  if (!o) return { name: 'modal-overlay-blur', ok: false }
  const s = getComputedStyle(o)
  return { name: 'modal-overlay-blur', backdropFilter: s.backdropFilter || s.webkitBackdropFilter }
}))

// 3. card entrance animation
await page.locator('button:has-text("Close")').first().click()
await page.waitForTimeout(300)
checks.push(await page.evaluate(() => {
  const c = document.querySelector('.card')
  if (!c) return { name: 'card-animation', ok: false }
  return { name: 'card-animation', animation: getComputedStyle(c).animation }
}))

// 4. header blur
checks.push(await page.evaluate(() => {
  const h = document.querySelector('.app-header')
  if (!h) return { name: 'header-blur', ok: false }
  const s = getComputedStyle(h)
  return { name: 'header-blur', backdropFilter: s.backdropFilter || s.webkitBackdropFilter }
}))

// 5. bottom nav blur
checks.push(await page.evaluate(() => {
  const b = document.querySelector('.bottom-nav')
  if (!b) return { name: 'nav-blur', ok: false }
  const s = getComputedStyle(b)
  return { name: 'nav-blur', backdropFilter: s.backdropFilter || s.webkitBackdropFilter }
}))

await browser.close()
console.log(JSON.stringify(checks, null, 2))

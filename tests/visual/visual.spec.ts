import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { installKomariFixture } from './fixtures/komari'

const STABLE_STYLE = `
  *, *::before, *::after {
    animation: none !important;
    caret-color: transparent !important;
    transition: none !important;
  }
  html { scroll-behavior: auto !important; }
  .earth-globe-host canvas,
  .earth-globe-canvas { opacity: 0 !important; }
`

async function openStablePage(page: Page, path = '/'): Promise<void> {
  await page.goto(path)
  await expect(page.getByRole('heading', { name: 'Komari Visual Lab' })).toBeVisible()
  await page.addStyleTag({ content: STABLE_STYLE })
  await page.waitForTimeout(700)
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', await page.locator('html').evaluate(element => element.clientWidth))
}

async function expectNodeMetricIcons(page: Page): Promise<void> {
  for (const metric of ['cpu', 'memory', 'disk', 'traffic'])
    await expect(page.locator(`[data-node-metric-icon="${metric}"]`).first()).toBeVisible()
}

async function expectNodePingBars(page: Page): Promise<void> {
  const card = page.getByRole('button', { name: '查看节点 主控-洛杉矶 详情' })
  for (const metric of ['latency', 'loss']) {
    const bars = card.locator(`[data-node-ping-bars="${metric}"]`)
    await expect(bars).toBeVisible()
    await expect.poll(() => bars.evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThan(0)
  }
}

test('home light desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page)
  await openStablePage(page)
  await expectNodeMetricIcons(page)
  await expectNodePingBars(page)
  await expect(page).toHaveScreenshot('home-light-desktop.png', { fullPage: false })
})

test('home dark mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installKomariFixture(page, { dark: true })
  await openStablePage(page)
  await expectNodeMetricIcons(page)
  await expect(page).toHaveScreenshot('home-dark-mobile.png', { fullPage: false })
})

test('mobile footer credits stay on one line', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installKomariFixture(page, { dark: true, visitorInfoEnabled: false })
  await openStablePage(page)

  await expect(page.locator('[data-footer-credit="powered"]')).toContainText('Powered by Komari Monitor')
  await expect(page.locator('[data-footer-credit="theme"]')).toContainText('Theme by TonyStarkJr2021')
  for (const credit of await page.locator('[data-footer-credit]').all()) {
    await expect.poll(() => credit.evaluate((element) => {
      const style = getComputedStyle(element)
      const lineHeight = Number.parseFloat(style.lineHeight)
      return element.getBoundingClientRect().height <= lineHeight * 1.2
    })).toBe(true)
  }
})

test('desktop compact cards show complete traffic and pact information', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, { dark: true })
  await openStablePage(page)

  const rows = page.locator('[data-node-remaining-info-row]')
  await expect(rows.first()).toBeVisible()
  const clippedRows = await rows.evaluateAll(elements => elements
    .map(element => ({ text: element.textContent?.trim(), overflow: element.scrollWidth - element.clientWidth }))
    .filter(item => item.overflow > 1))
  expect(clippedRows).toEqual([])

  const metricValues = page.locator('[data-node-compact-metric-value]')
  await expect(metricValues.first()).toBeVisible()
  const clippedValues = await metricValues.evaluateAll(elements => elements
    .map(element => ({ text: element.textContent?.trim(), overflow: element.scrollWidth - element.clientWidth }))
    .filter(item => item.overflow > 1))
  expect(clippedValues).toEqual([])
})

test('header theme button toggles directly between deep-space and starlight', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, { dark: true })
  await openStablePage(page)

  const html = page.locator('html')
  await expect(html).toHaveClass(/dark/)

  await page.getByRole('button', { name: '切换到星光模式' }).click()
  await expect(html).not.toHaveClass(/dark/)
  await expect(page.getByRole('button', { name: '切换到深空模式' })).toBeVisible()

  await page.getByRole('button', { name: '切换到深空模式' }).click()
  await expect(html).toHaveClass(/dark/)
  await expect(page.getByRole('button', { name: '切换到星光模式' })).toBeVisible()
})

test('starlight mode presents guest as a GLORIA fan', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await installKomariFixture(page)
  await openStablePage(page)

  await expect(page.getByText('棋士', { exact: true })).toBeVisible()
  await expect(page.getByText('来自 Tokyo 的星光已接入', { exact: true })).toBeVisible()
  await expect(page).toHaveScreenshot('starlight-guest-desktop.png', { fullPage: false })
})

test('deep-space mode keeps the understated visitor glass card', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await installKomariFixture(page, { dark: true })
  await openStablePage(page)

  await expect(page.getByText('棋士', { exact: true })).toBeVisible()
  await expect(page).toHaveScreenshot('deep-space-guest-desktop.png', { fullPage: false })
})

test.describe('README preview', () => {
  test.use({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })

  test('deep-space mode stays unobstructed at high resolution', async ({ page }) => {
    await installKomariFixture(page, { dark: true, visitorInfoEnabled: false })
    await openStablePage(page)

    await expect(page.getByText('棋士', { exact: true })).toHaveCount(0)
    await expect(page).toHaveScreenshot('deep-space-preview-3200.png', { fullPage: false, scale: 'device' })
  })
})

test('wide desktop keeps the vertical endurance inscription inside the empty left gutter', async ({ page }) => {
  await page.setViewportSize({ width: 1790, height: 936 })
  await installKomariFixture(page, { dark: true })
  await openStablePage(page)

  const inscription = page.locator('.gloria-home-inscription')
  await expect(inscription).toBeVisible()
  await expect(inscription.getByText('惟有忍耐到底的', { exact: true })).toBeVisible()
  await expect(page.locator('.gloria-home-inscription strong')).toHaveCSS('writing-mode', 'vertical-rl')
  const bounds = await inscription.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.x).toBeGreaterThanOrEqual(47)
  expect(bounds!.x).toBeLessThanOrEqual(49)
  expect(bounds!.height).toBeGreaterThan(bounds!.width * 4)
  await expect(inscription.locator('.gloria-home-inscription__ellipsis i')).toHaveCount(3)
  const firstStatCardBounds = await page.locator('.gloria-stat-card').first().boundingBox()
  expect(firstStatCardBounds).not.toBeNull()
  expect(bounds!.x + bounds!.width).toBeLessThan(firstStatCardBounds!.x)
  const visitorBounds = await page.locator('.visitor-info-card').boundingBox()
  if (visitorBounds)
    expect(bounds!.y + bounds!.height).toBeLessThan(visitorBounds.y)
  await expect(page).toHaveScreenshot('home-dark-wide-inscription.png', { fullPage: false })
})

test('authenticated user is presented as the GLORIA navigator', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await installKomariFixture(page, { loggedIn: true })
  await openStablePage(page)

  await expect(page.getByText('领航员', { exact: true })).toBeVisible()
})

test('home accessible list desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, { colorVisionFriendly: true, viewMode: 'list', hideEarth: true })
  await openStablePage(page)
  await expect(page).toHaveScreenshot('home-accessible-list-desktop.png', { fullPage: false })
})

test('home cobe layout desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, { earthRenderer: 'cobe' })
  await openStablePage(page)
  await expectNodeMetricIcons(page)
  await expect(page).toHaveScreenshot('home-cobe-desktop.png', { fullPage: false })
})

test('home tiled layout desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, { earthRenderer: 'tiled' })
  await openStablePage(page)
  await expectNodeMetricIcons(page)
  await expect(page).toHaveScreenshot('home-tiled-desktop.png', { fullPage: false })
})

test('home tiled layout respects custom general cards and order', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, {
    earthRenderer: 'tiled',
    generalCardKeys: ['currentTime', 'offlineNodes'],
  })
  await openStablePage(page)

  const cards = page.locator('[data-general-card-key]')
  await expect(cards).toHaveCount(2)
  await expect(cards.first()).toHaveAttribute('data-general-card-key', 'currentTime')
  await expect(cards.nth(1)).toHaveAttribute('data-general-card-key', 'offlineNodes')
})

test('GLORIA world map highlights node regions and opens wedding-dress easter egg', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, { dark: true })
  await openStablePage(page)

  const marker = page.locator('[data-map-marker-code="US"]')
  await expect(marker).toBeVisible()
  await marker.hover()
  await expect(page.locator('[data-country-code="US"].is-active')).toBeVisible()

  await page.locator('[data-gloria-easter-trigger="wedding"]').click()
  await expect(page.getByText('如果神让你看见', { exact: true })).toBeVisible()
  await expect(page.locator('.gloria-easter__backdrop')).toHaveAttribute('src', '/images/gloria/iag-2-wedding-original.jpg')
  await expect(page).toHaveScreenshot('gloria-easter-desktop.png', { fullPage: false })
})

test('Crystal G opens the reflected-light easter egg independently', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, { dark: true })
  await openStablePage(page)

  await page.locator('[data-gloria-easter-trigger="reflection"]').click()
  await expect(page.getByText('见过光，就应该把光反射出去', { exact: true })).toBeVisible()
  await expect(page.getByText('如果神让你看见', { exact: true })).toHaveCount(0)
  await expect(page.locator('.gloria-easter__backdrop')).toHaveAttribute('src', '/images/gloria/iag-light-reflection-original.png')
  await expect(page).toHaveScreenshot('gloria-reflection-easter-desktop.png', { fullPage: false })
})

test('Crystal G reflected-light easter egg remains readable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installKomariFixture(page, { dark: true })
  await openStablePage(page)

  await page.locator('[data-gloria-easter-trigger="reflection"]').click()
  await expect(page.getByText('见过光，就应该把光反射出去', { exact: true })).toBeVisible()
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(horizontalOverflow).toBeLessThanOrEqual(1)
  await expect(page).toHaveScreenshot('gloria-reflection-easter-mobile.png', { fullPage: false })
})

test('licensed audio mappings connect node tracks and region stars', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, { audioPreview: true })
  await page.addInitScript(() => {
    const audioWindow = window as typeof window & { __gloriaAudioPlaySources?: string[] }
    audioWindow.__gloriaAudioPlaySources = []
    HTMLMediaElement.prototype.play = function () {
      audioWindow.__gloriaAudioPlaySources?.push(this.src)
      return Promise.resolve()
    }
  })
  await openStablePage(page)

  const card = page.getByRole('button', { name: '查看节点 主控-洛杉矶 详情' })
  await expect(card.locator('[title="悬停试听《多远都要在一起》片段"]')).toBeVisible()
  await card.hover()
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __gloriaAudioPlaySources?: string[] }).__gloriaAudioPlaySources?.length ?? 0)).toBeGreaterThan(0)

  const marker = page.locator('[data-map-marker-code="US"]')
  await marker.hover()
  await expect(page.getByText('♫ 《Where Did U Go》', { exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __gloriaAudioPlaySources?: string[] }).__gloriaAudioPlaySources?.length ?? 0)).toBeGreaterThan(1)
})

test('home mini card metric icons remain accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installKomariFixture(page, { nodeCardSize: 'mini', hideEarth: true })
  await openStablePage(page)

  const card = page.getByRole('button', { name: '查看节点 主控-洛杉矶 详情' })
  await expect(card.locator('[data-node-metric-icon="cpu"]')).toBeVisible()
  await expect(card.locator('[data-node-metric-icon="memory"]')).toBeVisible()
  await expect(card.locator('[data-node-metric-icon="traffic"]')).toBeVisible()
  await expect(card.getByRole('img', { name: 'CPU' })).toBeVisible()
  await expect(card.getByRole('img', { name: '内存' })).toBeVisible()
})

test('node card expiry uses red through 5 days and yellow through 10 days', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, { expiryThresholds: true, hideEarth: true })
  await openStablePage(page)

  const criticalCard = page.getByRole('button', { name: '查看节点 主控-洛杉矶 详情' })
  const warningCard = page.getByRole('button', { name: '查看节点 香港边缘节点-超长名称布局测试 详情' })
  const criticalExpiry = criticalCard.getByText('余期', { exact: true }).locator('..')
  const warningExpiry = warningCard.getByText('余期', { exact: true }).locator('..')

  await expect(criticalExpiry).toContainText('余期5天')
  await expect(criticalExpiry).toHaveClass(/text-destructive/)
  await expect(warningExpiry).toContainText('余期10天')
  await expect(warningExpiry).toHaveClass(/text-warning/)
})

test('free node pricing stays semantic across home, finance, and detail', async ({ page }) => {
  const freeNodeName = '主控-洛杉矶'
  const freeNodeUuid = '00000000-0000-4000-8000-000000000001'
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, { freePriceNode: true, hideEarth: true })
  await openStablePage(page)

  const nodeCard = page.getByRole('button', { name: `查看节点 ${freeNodeName} 详情` })
  await expect(nodeCard.getByText('星光赠礼', { exact: true })).toBeVisible()
  await expect(nodeCard.getByText('无', { exact: true })).toBeVisible()
  await expect(nodeCard.getByText('免费 / 年', { exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: '查看剩余价值明细' }).click()
  const financeDialog = page.getByRole('dialog', { name: '价值与费用明细' })
  await expect(financeDialog.getByText(freeNodeName, { exact: true })).toHaveCount(0)
  await financeDialog.getByLabel('排除免费节点').uncheck()
  const freeNodeRow = financeDialog.getByRole('cell', { name: freeNodeName, exact: true }).locator('..')
  await expect(freeNodeRow).toBeVisible()
  await expect(freeNodeRow.getByText('免费', { exact: true })).toBeVisible()
  await expect(freeNodeRow.getByText('无', { exact: true })).toBeVisible()

  await page.goto(`/instance/${freeNodeUuid}`)
  await expect(page.getByText('硬件信息', { exact: true })).toBeVisible()
  await expect(page.getByText('节点价格', { exact: true })).toBeVisible()
  await expect(page.getByText('剩余价值', { exact: true })).toBeVisible()
  await expect(page.getByText('无', { exact: true })).toBeVisible()
  await expect(page.getByText('免费 / 月', { exact: true })).toHaveCount(0)
})

test('detail light desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page)
  await openStablePage(page, '/instance/00000000-0000-4000-8000-000000000001')
  await expect(page.getByText('硬件信息')).toBeVisible()
  await expect(page).toHaveScreenshot('detail-light-desktop.png', { fullPage: false })
})

test('detail dark mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installKomariFixture(page, { dark: true })
  await openStablePage(page, '/instance/00000000-0000-4000-8000-000000000002')
  await expect(page.getByText('硬件信息')).toBeVisible()
  await expect(page).toHaveScreenshot('detail-dark-mobile.png', { fullPage: false })
})

test('detail short history falls back when metric history omits CPU', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, { missingCpuMetricHistory: true })
  await openStablePage(page, '/instance/00000000-0000-4000-8000-000000000001')

  const cpuValue = page.locator('[data-load-chart-card="cpu"] [data-latest-cpu]')
  const loadRange = page.locator('[data-load-chart-range]')
  for (const view of ['4 小时', '1 天']) {
    await loadRange.getByRole('tab', { name: view, exact: true }).click()
    await expect(cpuValue).toHaveText(/^\d+\.\d$/)
  }
})

test('detail history keeps cumulative traffic counters on their last value', async ({ page }) => {
  const historyCalls: Array<Record<string, unknown>> = []

  page.on('request', (request) => {
    if (!request.url().endsWith('/api/rpc2'))
      return

    const payload = request.postDataJSON() as { method?: string, params?: Record<string, unknown> } | null
    const metricKeys = Array.isArray(payload?.params?.metric_keys) ? payload.params.metric_keys : []
    if (payload?.method === 'public:queryMetrics' && metricKeys.includes('net.total.up'))
      historyCalls.push(payload.params ?? {})
  })

  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page)
  await openStablePage(page, '/instance/00000000-0000-4000-8000-000000000001')

  await page.locator('[data-load-chart-range]').getByRole('tab', { name: '1 天', exact: true }).click()
  await expect.poll(() => historyCalls.length).toBeGreaterThan(0)

  expect(historyCalls.at(-1)).toMatchObject({
    aggregation: 'avg',
    aggregation_by_metric: {
      'net.total.up': 'last',
      'net.total.down': 'last',
    },
  })
})

test('detail ping requests stay scoped to the current node', async ({ page }) => {
  const currentUuid = '00000000-0000-4000-8000-000000000001'
  const metricCalls: Array<{ method: string, params: Record<string, unknown> }> = []
  const isPingMetricCall = (call: { method: string, params: Record<string, unknown> }): boolean => {
    const metricKeys = Array.isArray(call.params.metric_keys) ? call.params.metric_keys : []
    return call.method === 'public:getPingMetricStats'
      || metricKeys.includes('ping.latency_ms')
      || metricKeys.includes('ping.loss')
  }

  page.on('request', (request) => {
    if (!request.url().endsWith('/api/rpc2'))
      return

    const payload = request.postDataJSON() as { method?: string, params?: Record<string, unknown> } | null
    if (payload?.method === 'public:queryMetrics' || payload?.method === 'public:getPingMetricStats') {
      metricCalls.push({ method: payload.method, params: payload.params ?? {} })
    }
  })

  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page)
  await openStablePage(page)

  await expect.poll(() => metricCalls.filter(isPingMetricCall).length).toBeGreaterThan(0)
  const homeSummaryCalls = metricCalls.filter(call => call.method === 'public:queryMetrics' && isPingMetricCall(call))
  expect(homeSummaryCalls.length).toBeGreaterThan(0)
  expect(homeSummaryCalls.every(call => call.params.max_points === 150)).toBe(true)

  metricCalls.length = 0
  await page.getByRole('button', { name: '查看节点 主控-洛杉矶 详情' }).click()
  await expect(page).toHaveURL(`/instance/${currentUuid}`)
  await expect(page.getByText('硬件信息')).toBeVisible()
  await page.waitForTimeout(2_000)

  const detailPingCalls = metricCalls.filter(isPingMetricCall)
  expect(detailPingCalls.length).toBeGreaterThan(0)
  expect(new Set(detailPingCalls.map(call => call.params.entity_id))).toEqual(new Set([currentUuid]))
})

test('detail ping tasks follow the backend task order', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await installKomariFixture(page, { pingTaskOrdering: true })
  await openStablePage(page, '/instance/00000000-0000-4000-8000-000000000001')

  const taskCards = page.locator('[data-ping-task-id]')
  await expect(taskCards).toHaveCount(3)
  await expect(taskCards.first()).toHaveAttribute('data-ping-task-id', '30')
  await expect(taskCards.nth(1)).toHaveAttribute('data-ping-task-id', '10')
  await expect(taskCards.nth(2)).toHaveAttribute('data-ping-task-id', '20')
  await expect(taskCards).toContainText(['浙江移动', '浙江联通', '浙江电信'])
})

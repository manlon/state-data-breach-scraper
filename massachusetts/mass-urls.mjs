import { initBrowser } from '../utils.mjs'

export const handler = async () => {
  const browser = await initBrowser()
  const page = await browser.newPage()

  await page.goto('https://www.mass.gov/lists/data-breach-reports', {
    waitUntil: 'networkidle0',
  })
  const links = await page.$$eval('.ma__download-link__file-link', (els) =>
    els.map((el) => el.getAttribute('href'))
  )

  await browser.close()

  return links
}

if (process.env.RUN) {
  handler()
}

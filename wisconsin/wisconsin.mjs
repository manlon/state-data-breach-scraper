import { createRow, initBrowser } from '../utils.mjs'

export const handler = async () => {
  const DATA = []
  const browser = await initBrowser()
  const page = await browser.newPage()

  const pages = [
    // 2012-2018
    {
      url: 'https://datcp.wi.gov/Pages/Programs_Services/DataBreachArchive.aspx',
      tableSelector: '.content-area-1 table',
    },
    // 2021-Present
    {
      url: 'https://datcp.wi.gov/Pages/Programs_Services/DataBreaches.aspx',
      tableSelector: '.ms-rteTable-default',
    },
  ]
  for (const { url, tableSelector } of pages) {
    await page.goto(url, {
      waitUntil: 'networkidle0',
    })

    let tables = await page.$$(tableSelector)
    for (const table of tables) {
      let trs = []
      for (const tr of await table.$$('tr')) {
        const childLength = await page.evaluate(
          (el) => el.childNodes.length,
          tr
        )
        if (childLength > 0) {
          trs.push(tr)
        }
      }
      const [reported, dates, entity, accessed] = await trs[1].$$('td')
      const [affected, details] = await trs[3].$$('td')
      const businessName = await page.evaluate(
        (el) => el.textContent.trim(),
        entity
      )
      let reportedDate = await page.evaluate(
        (el) => el.textContent.trim(),
        reported
      )
      reportedDate = reportedDate.replace(/[\u200B-\u200D\uFEFF]/g, ' ').trim()
      let breachDates = await page.evaluate(
        (el) => el.textContent.trim(),
        dates
      )
      // Between August 28, 2018 and December 3, 2018
      // Since 2014
      // October 16, 2018
      // April 2018
      // January 1, 2013 through March 28, 2018
      // First week of May 2018
      // September 27 - October 12, 2017
      // Unknown
      // Late February 2018
      // Thursday, September 28, 2017
      // July 25-28, 2017
      // Early August
      // Between mid-May and July 29th, 2017
      // Prior to June 2013
      // Mid-September 2016 - February 2017
      let rangeMatch = /(?:Between)?(.+)\s+(?:and|-|through|to)\s+(.+)/.exec(
        breachDates
      )
      if (rangeMatch) {
        const firstDate = new Date(rangeMatch[1])
        const secondDate = new Date(rangeMatch[2])
        if (
          firstDate.toString() !== 'Invalid Date' &&
          secondDate.toString() !== 'Invalid Date'
        ) {
          breachDates = [
            firstDate.toLocaleDateString(),
            secondDate.toLocaleDateString(),
          ]
        } else {
          breachDates = [rangeMatch[1], rangeMatch[2]]
        }
      } else if (
        (rangeMatch =
          /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d+)\s*-\s*(\d+),?\s*(\d{4})/.exec(
            breachDates
          ))
      ) {
        const firstDate = new Date(
          `${rangeMatch[1]} ${rangeMatch[2]}, ${rangeMatch[4]}`
        )
        const secondDate = new Date(
          `${rangeMatch[1]} ${rangeMatch[3]}, ${rangeMatch[4]}`
        )
        if (
          firstDate.toString() !== 'Invalid Date' &&
          secondDate.toString() !== 'Invalid Date'
        ) {
          breachDates = [
            firstDate.toLocaleDateString(),
            secondDate.toLocaleDateString(),
          ]
        }
      } else if (new Date(breachDates).toString() !== 'Invalid Date') {
        breachDates = new Date(breachDates).toLocaleDateString()
      }
      const dataAccessed = await page.evaluate(
        (el) => el.textContent.trim(),
        accessed
      )
      const affectedText = await page.evaluate(
        (el) => el.textContent.trim(),
        affected
      )
      const affectedMatch = /([\d,]+)\s+[Ww]isconsin\s+residents/.exec(
        affectedText
      )
      let numberAffected
      if (affectedMatch) {
        numberAffected = parseInt(affectedMatch[1], 10)
      }
      DATA.push(
        createRow('WI')({
          businessName,
          reportedDate: new Date(reportedDate).toLocaleDateString(),
          breachDates,
          numberAffected,
          dataAccessed,
        })
      )
    }
    if (url.indexOf('Archive') != -1) {
      continue
    }
    const h4s = await page.$$('h4')
    for (const h4 of h4s) {
      let done = false
      let currentEl = h4
      let sibling
      let businessName, reportedDate, breachDates, numberAffected, dataAccessed
      while (!done) {
        sibling = await page.evaluateHandle(
          (el) => el.nextElementSibling,
          currentEl
        )
        const tagName = await page.evaluate((el) => el && el.tagName, sibling)
        if (!tagName) {
          done = true
          break
        }
        if (tagName === 'P') {
          const text = await page.evaluate(
            (el) => el.textContent.trim(),
            sibling
          )
          const parts = text.split(':')
          if (parts.length === 2) {
            let [label, value] = parts
            value = value.trim()
            if (label.indexOf('Company') > -1) {
              businessName = value
            } else if (label.indexOf('Date of Incident') > -1) {
              breachDates = value
              let rangeMatch =
                /(?:Between)?(.+)\s+(?:and|-|through|to)\s+(.+)/.exec(
                  breachDates
                )
              if (rangeMatch) {
                const firstDate = new Date(rangeMatch[1])
                const secondDate = new Date(rangeMatch[2])
                if (
                  firstDate.toString() !== 'Invalid Date' &&
                  secondDate.toString() !== 'Invalid Date'
                ) {
                  breachDates = [
                    firstDate.toLocaleDateString(),
                    secondDate.toLocaleDateString(),
                  ]
                } else {
                  breachDates = [rangeMatch[1], rangeMatch[2]]
                }
              } else if (
                (rangeMatch =
                  /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d+)\s*-\s*(\d+),?\s*(\d{4})/.exec(
                    breachDates
                  ))
              ) {
                const firstDate = new Date(
                  `${rangeMatch[1]} ${rangeMatch[2]}, ${rangeMatch[4]}`
                )
                const secondDate = new Date(
                  `${rangeMatch[1]} ${rangeMatch[3]}, ${rangeMatch[4]}`
                )
                if (
                  firstDate.toString() !== 'Invalid Date' &&
                  secondDate.toString() !== 'Invalid Date'
                ) {
                  breachDates = [
                    firstDate.toLocaleDateString(),
                    secondDate.toLocaleDateString(),
                  ]
                }
              } else if (new Date(breachDates).toString() !== 'Invalid Date') {
                breachDates = new Date(breachDates).toLocaleDateString()
              }
            }
            if (label.indexOf('Notified') > -1) {
              reportedDate = value
              if (new Date(reportedDate).toString() !== 'Invalid Date') {
                reportedDate = new Date(reportedDate).toLocaleDateString()
              }
            } else if (label.indexOf('Data Accessed') > -1) {
              dataAccessed = value
            }
            if (label.indexOf('Wisconsin Residents Affected') > -1) {
              if (!isNaN(parseInt(value, 10))) {
                numberAffected = parseInt(value, 10)
              }
            }
          } else {
            if (businessName) {
              DATA.push(
                createRow('WI')({
                  businessName,
                  reportedDate,
                  breachDates,
                  numberAffected,
                  dataAccessed,
                })
              )
              businessName = undefined
              reportedDate = undefined
              breachDates = undefined
              numberAffected = undefined
              dataAccessed = undefined
            }
          }
        } else {
          if (businessName) {
            DATA.push(
              createRow('WI')({
                businessName,
                reportedDate,
                breachDates,
                numberAffected,
                dataAccessed,
              })
            )
            businessName = undefined
            reportedDate = undefined
            breachDates = undefined
            numberAffected = undefined
            dataAccessed = undefined
          }
          done = true
        }
        currentEl = sibling
      }
    }
  }

  // 2019-2020
  await page.goto(
    'https://datcp.wi.gov/Pages/Programs_Services/DataBreachDatabase.aspx',
    {
      waitUntil: 'networkidle0',
    }
  )
  const table = await page.waitForSelector('#sortableTable')
  const rows = await table.$$('tbody > tr')
  for (const row of rows) {
    const [bizName, year, dates, reported, affected, accessed] = await row.$$(
      'td'
    )
    const businessName = await page.evaluate(
      (el) => el.textContent.trim(),
      bizName
    )
    let breachDates = await page.evaluate((el) => el.textContent.trim(), dates)
    let rangeMatch = /(?:Between)?(.+)\s+(?:and|-|through|to)\s+(.+)/.exec(
      breachDates
    )
    if (rangeMatch) {
      const firstDate = new Date(rangeMatch[1])
      const secondDate = new Date(rangeMatch[2])
      if (
        firstDate.toString() !== 'Invalid Date' &&
        secondDate.toString() !== 'Invalid Date'
      ) {
        breachDates = [
          firstDate.toLocaleDateString(),
          secondDate.toLocaleDateString(),
        ]
      } else {
        breachDates = [rangeMatch[1], rangeMatch[2]]
      }
    } else if (
      (rangeMatch =
        /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d+)\s*-\s*(\d+),?\s*(\d{4})/.exec(
          breachDates
        ))
    ) {
      const firstDate = new Date(
        `${rangeMatch[1]} ${rangeMatch[2]}, ${rangeMatch[4]}`
      )
      const secondDate = new Date(
        `${rangeMatch[1]} ${rangeMatch[3]}, ${rangeMatch[4]}`
      )
      if (
        firstDate.toString() !== 'Invalid Date' &&
        secondDate.toString() !== 'Invalid Date'
      ) {
        breachDates = [
          firstDate.toLocaleDateString(),
          secondDate.toLocaleDateString(),
        ]
      }
    }

    let reportedDate = await page.evaluate(
      (el) => el.textContent.trim(),
      reported
    )
    if (new Date(reportedDate).toString() !== 'Invalid Date') {
      reportedDate = new Date(reportedDate).toLocaleDateString()
    }

    const affectedText = await page.evaluate(
      (el) => el.textContent.trim(),
      affected
    )
    const affectedMatch = /([\d,]+)\s+[Ww]isconsin\s+residents/.exec(
      affectedText
    )
    let numberAffected
    if (affectedMatch) {
      numberAffected = parseInt(affectedMatch[1], 10)
    }
    const dataAccessed = await page.evaluate(
      (el) => el.textContent.trim(),
      accessed
    )
    DATA.push(
      createRow('WI')({
        businessName,
        reportedDate,
        breachDates,
        numberAffected,
        dataAccessed,
      })
    )
  }

  await browser.close()

  console.log(DATA)
  return DATA
}

if (process.env.RUN) {
  handler()
}

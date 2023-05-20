import { get } from 'https'
import fs from 'fs'
import PDF from 'pdf-table-extractor'

import { createRow, initBrowser } from '../utils.mjs'


export const handler = async () => {
  const DATA = []
  const browser = await initBrowser()
  const page = await browser.newPage()

  await page.goto('https://www.mass.gov/lists/data-breach-reports', {
    waitUntil: 'networkidle0',
  })
  const links = await page.$$eval('.ma__download-link__file-link', (els) => (
    els.map(el => el.getAttribute('href'))
  ))

  await browser.close()

  for (const url of links) {
    let done
    let promise = new Promise((resolve, reject) => {
      done = resolve
    })
    const path = new URL(url).pathname
    const filename = path.split('/')[2]
    const file = fs.createWriteStream(`./tmp/${filename}.pdf`)
    const req = get(url, (resp) => {
      resp.on("data", (chunk) => {
        file.write(chunk)  
      })

      resp.on("end", () => {
        file.end()
      })
    });
    file.on("close", async () => {
      PDF(`./tmp/${filename}.pdf`, (data) => {
        for (const page of data.pageTables) {
          for (const table of page.tables.slice(2)) {
            const [
              breachNumber,
              reportedDate,
              entityName,
              breachType,
              occuredAtReportingEntity,
              numberAffected,
              SSNIncluded,
              accountNumberIncluded,
              driversLicenseIncluded,
              creditDebitNumbersIncluded,
              creditMonitoringProvided,
            ] = table;
            const dataAccessed = []
            if (SSNIncluded.trim().toLowerCase() === 'yes') {
              dataAccessed.push('SSN')
            }
            if (accountNumberIncluded.trim().toLowerCase() === 'yes') {
              dataAccessed.push('account number')
            }
            if (driversLicenseIncluded.trim().toLowerCase() === 'yes') {
              dataAccessed.push('drivers license')
            }
            if (creditDebitNumbersIncluded.trim().toLowerCase() === 'yes') {
              dataAccessed.push('credit/debit card number(s)')
            }
            DATA.push(
              createRow('MA')({
                businessName: entityName,
                reportedDate,
                numberAffected,
                breachType,
                dataAccessed,
              })
            );
          }
        }
        done()
      })
    })
    await promise
  }

  console.log(DATA)
  return DATA
}

if (process.env.RUN) {
  handler()
}

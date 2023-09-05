import { get } from 'https'
import fs from 'fs'
import PDF from 'pdf-table-extractor'

const createRow = (state) => (data) => {
  return {
    state,
    entity_name: data.businessName || '',
    dba: data.dba || '', // ND only
    business_address: data.businessAddress || '', // TX only
    business_city: data.businessCity || '', // TX only
    business_state: data.businessState || '', // TX only
    business_zip: data.businessZip || '', // TX only
    start_date: data.startDate || '',
    end_date: data.endDate || '',
    breach_dates: data.breachDates || '',
    reported_date: data.reportedDate || '',
    published_date: data.publishedDate || '', // TX only
    number_affected: data.numberAffected || '',
    data_accessed: data.dataAccessed || '',
    notice_methods: data.noticeMethods || '', // TX only
    breach_type: data.breachType || '',
    data_source: data.dataSource || '',
    letter_url: data.letterURL || '',
    url: data.url || '',
  }
}

export const handler = async (links) => {
  const DATA = []

  for (const url of links) {
    let done
    let promise = new Promise((resolve, reject) => {
      done = resolve
    })
    const path = new URL(url).pathname
    const filename = path.split('/')[2]
    const file = fs.createWriteStream(`/tmp/${filename}.pdf`)
    const req = get(url, (resp) => {
      resp.on('data', (chunk) => {
        file.write(chunk)
      })

      resp.on('end', () => {
        file.end()
      })
    })
    file.on('close', async () => {
      PDF(`/tmp/${filename}.pdf`, (data) => {
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
            ] = table
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
                numberAffected: parseInt(numberAffected, 10),
                breachType,
                dataAccessed,
              })
            )
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
  handler(['https://www.mass.gov/doc/data-breach-report-2023/download'])
}

import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

const normalizeDate = (dateString) => {
  const firstNum = dateString.search(/\d/)
  let [month, day, year] = dateString.substring(firstNum).split('/')
  if (day === undefined) {
    return dateString
  }
  if (month.length === 1) {
    month = '0' + month
  }
  if (day.length === 1) {
    day = '0' + day
  }
  const lastNum = year.search(/[^\d]/)
  year = year.substring(0, lastNum === -1 ? year.length : lastNum)
  if (year.length > 4) {
    year = year.substring(0, 4)
  } else
  if (year.length === 2) {
    year = "20" + year
  }
  return `${year}-${month}-${day}`
}

export const createRow = (state) => (data) => {
  return {
    state,
    entity_name: data.businessName || '',
    dba: data.dba || '', // ND only
    business_address: data.businessAddress || '', // TX only
    business_city: data.businessCity || '', // TX only
    business_state: data.businessState || '', // TX only
    business_zip: data.businessZip || '', // TX only
    start_date: data.startDate || '',
    start_date_normalized: data.startDate ? normalizeDate(data.startDate) : '',
    end_date: data.endDate || '',
    end_date_normalized: data.endDate ? normalizeDate(data.endDate) : '',
    breach_dates: data.breachDates || '',
    reported_date: data.reportedDate || '',
    reported_date_normalized: data.reportedDate ? normalizeDate(data.reportedDate) : '',
    published_date: data.publishedDate || '', // TX only
    published_date_normalized: data.publishedDate ? normalizeDate(data.publishedDate) : '',
    number_affected: data.numberAffected || '',
    data_accessed: data.dataAccessed || '',
    notice_methods: data.noticeMethods || '', // TX only
    breach_type: data.breachType || '',
    data_source: data.dataSource || '',
    letter_url: data.letterURL || '',
    url: data.url || '',
  }
}

export const initBrowser = async () => {
  return await puppeteer.launch({
    args: chromium.args,
    ignoreHTTPSErrors: true,
    defaultViewport: chromium.defaultViewport,
    executablePath:
      process.env.NODE_ENV !== 'production'
        ? './chrome/mac_arm-1065249/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
        : await chromium.executablePath,
    headless: process.env.NODE_ENV === 'production',
  })
}

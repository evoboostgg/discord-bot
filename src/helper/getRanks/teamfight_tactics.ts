import puppeteer from 'puppeteer';

export async function getTeamfightTacticsPeak(usertag: string) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const encodedUsertag = usertag.replace('#', '%23');

  const url = `https://tracker.gg/valorant/profile/riot/${encodedUsertag}/overview`;

  await page.goto(url)

  await page.setViewport({ width: 1080, height: 1024 });

  const peakSelctor = '#app > div.trn-wrapper > div.trn-container > div > main > div.content.no-card-margin > div.site-container.trn-grid.trn-grid--vertical.trn-grid--small > div.trn-grid.container > div.area-sidebar > div.rating-summary.trn-card.trn-card--bordered.has-primary.area-rating > div.rating-summary__content.rating-summary__content--secondary > div > div > div > div > div.rating-entry__rank-info > div.value'

  await page.waitForSelector('')

  const rank = ''

  return rank;
}

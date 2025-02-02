import puppeteer from 'puppeteer';

export async function getValorantPeakRank(usertag: string) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const encodedUsertag = usertag.replace('#', '%23');
  const url = `https://tracker.gg/valorant/profile/riot/${encodedUsertag}/overview`;

  try {
    await page.goto(url);
    await page.setViewport({ width: 1080, height: 1024 });

    // CSS selector for the peak rank element on tracker.gg
    const peakSelector =
      '#app > div.trn-wrapper > div.trn-container > div > main > div.content.no-card-margin > div.site-container.trn-grid.trn-grid--vertical.trn-grid--small > div.trn-grid.container > div.area-sidebar > div.rating-summary.trn-card.trn-card--bordered.has-primary.area-rating > div.rating-summary__content.rating-summary__content--secondary > div > div > div > div > div.rating-entry__rank-info > div.value';

    // Wait for the selector to load on the page
    await page.waitForSelector(peakSelector, { timeout: 10000 });

    // Extract the rank text from the page
    const rank = await page.$eval(peakSelector, (el) => el.textContent?.trim() || '');

    // Check if the rank is too low
    const validRanks = ['Immortal 2', 'Immortal 3', 'Radiant'];
    if (!validRanks.some((validRank) => rank.startsWith(validRank))) {
      await browser.close();
      return rank;
    }

    await browser.close();
    return rank;
  } catch (error: any) {
    console.error('Error fetching rank:', error.message);
    await browser.close();
    return 'Error fetching rank';
  }
}

const express = require('express');
const puppeteer = require('puppeteer');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const app = express();
const port = process.env.PORT || 3000;

const getBrowser = () =>
  IS_PRODUCTION
    ? // Connect to browserless so we don't run Chrome on the same hardware in production
      puppeteer.connect({ browserWSEndpoint: 'wss://chrome.browserless.io?token=c9e89be5-5134-485a-a04f-02e6c6d5042a' })
    : // Run the browser locally while in development
      puppeteer.launch();

app.get('/screenshot', async (req, res) => {
  try {
    let { url } = req.query;
    url = decodeURIComponent(url);

    // Prepend "http://" if the URL doesn't start with a protocol
    if (!/^https?:\/\//i.test(url)) {
      url = `http://${url}`;
    }

    const browser = await puppeteer.launch({headless: "new"});
    // getBrowser();
    const page = await browser.newPage();

    // Set a custom viewport size
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(url);
    const screenshot = await page.screenshot();

    await browser.close();

    res.set('Content-Type', 'image/png');
    res.send(screenshot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while capturing the screenshot' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
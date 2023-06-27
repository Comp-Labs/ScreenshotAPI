import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const port = process.env.PORT || 3000;

const cache = {};

app.get('/snap', async (req, res) => {
  let browser = null;
  let page = null;

  try {
    let url = decodeURIComponent(req.query.url);

  // Check if the screenshot is already cached
 if (cache[url]) {
  console.log('Serving from cache:', url);
  res.set('Content-Type', 'image/jpeg');
  res.send(cache[url]);
  return;
}

    // Prepend "http://" if the URL doesn't start with a protocol
    if (!/^https?:\/\//i.test(url)) {
      url = `http://${url}`;
    }

    browser = await puppeteer.launch();
    page = await browser.newPage();

    // Set a custom viewport size
    await page.setViewport({ width: 1920, height: 1080 });

    // Go to the URL
    await page.goto(url);

    // Take a screenshot
    const screenshot = await page.screenshot({
      path: 'screenshot.png',
    });

    cache[url] = screenshot;

    res.set('Content-Type', 'image/jpeg');
    res.send(screenshot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while capturing the screenshot' });
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

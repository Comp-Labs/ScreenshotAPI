const express = require('express');
const createBrowser = require('browserless');

const app = express();
const port = process.env.PORT || 3000;

app.get('/snap', async (req, res) => {
  try {
    let url = decodeURIComponent(req.query.url);

    // Prepend "http://" if the URL doesn't start with a protocol
    if (!/^https?:\/\//i.test(url)) {
      url = `http://${url}`;
    }

    const browser = await createBrowser({
      executablePath: process.env.CHROME_BIN,
      args: [
        // Required for Docker version of Puppeteer
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // This will write shared memory files into /tmp instead of /dev/shm,
        // because Docker’s default for /dev/shm is 64MB
        '--disable-dev-shm-usage'
      ],
  });
    const browserless = await browser.createContext();
    // const page = await browserless.newPage();

    // Set a custom viewport size
    // await page.setViewport({ width: 1920, height: 1080 });

    // await page.goto(url);
    const screenshot = await browserless.screenshot(url);

    res.set('Content-Type', 'image/jpeg');
    res.send(screenshot);

    await browserless.destroyContext();
    await browser.close();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while capturing the screenshot' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
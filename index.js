import express from 'express',
import createBrowser from 'browserless',

const app = express();
const port = process.env.PORT || 3000;

const cache = {};

app.get('/snap', async (req, res) => {
  let browser = null;
  let browserless = null;

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

    browser = await createBrowser({
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
    browserless = await browser.createContext();
    // const page = await browserless.newPage();

    // Set a custom viewport size
    // await page.setViewport({ width: 1920, height: 1080 });

    // await page.goto(url);
    const screenshot = await browserless.screenshot(url);

    cache[url] = screenshot;

    res.set('Content-Type', 'image/jpeg');
    res.send(screenshot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while capturing the screenshot' });
  } finally {
    if (browserless) {
      await browserless.destroyContext();
    }
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

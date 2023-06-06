import type { VercelRequest, VercelResponse } from '@vercel/node';
const createBrowser = require('browserless')({ lossyDeviceName: true });

export const config = {
    runtime: 'edge',
}

export default async function (request: VercelRequest, response: VercelResponse) {
    try {
        let url = decodeURIComponent(request.query.url);

        // Prepend "http://" if the URL doesn't start with a protocol
        if (!/^https?:\/\//i.test(url)) {
            url = `http://${url}`;
        }
        const browser = await createBrowser();
        const browserless = await browser.createContext();

        // Set a custom viewport size
        // await page.setViewport({ width: 1920, height: 1080 });

        // await page.goto(url);
        const screenshot = await browserless.screenshot(url);

        await browserless.destroyContext();
        await browser.close();

        response.setHeader('Content-Type', 'image/jpg');
        response.setHeader('Cache-Control', 'max-age=0, s-maxage=86400');
        response.send(screenshot);
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: 'An error occurred while capturing the screenshot' });
    }
}
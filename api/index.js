import express from 'express';
import puppeteer from 'puppeteer';
import { getPdf } from '../service/convert';

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

// Only allow GET requests
app.get('/pdf', async (req, res) => {
	try {
		if (req.method !== 'GET') return res.status(405).end()

		// Strip leading slash from request path
		const url = req.url.replace(/^\/+/, '')

		// Block favicon.ico requests from reaching puppeteer
		if (url === 'favicon.ico') return res.status(404).end()

		console.log(`Converting: ${url}`)
		const pdfBuffer = await getPdf(url)

		if (!pdfBuffer) return res.status(400).send('Error: Could not generate PDF')

		// Instruct browser to cache PDF for maxAge ms
		if (process.env.NODE_ENV !== 'development') res.setHeader('Cache-control', `public, max-age=${maxAge}`)

		// Set Content type to PDF and send the PDF to the client
		res.setHeader('Content-type', 'application/pdf')
		res.send(pdfBuffer)

	} catch (err) {
		if (err.message === 'Protocol error (Page.navigate): Cannot navigate to invalid URL')
			return res.status(404).end()

		console.error(err)
		res.status(500).send('Error: Please try again.')
	}
});

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
const express = require('express')
const puppeteer = require('puppeteer-core')
const { executablePath } = require('puppeteer')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 10000
const cache = {}

app.get('/', function(response) {
	response.render('home.html')
})

app.get('/snap', async (request, response) => {
	let browser = null
	let page = null
	try {
		let url = decodeURIComponent(request.query.url)
		// Check if the screenshot is already cached
		if (cache[url]) {
			console.log('Serving from cache:', url)
			response.set('Content-Type', 'image/jpeg')
			response.send(cache[url])
			return
		}

		// Prepend "http://" if the URL doesn't start with a protocol
		if (!(/^https?:\/\//i).test(url)) {
			url = `http://` + url
		}
		browser = await puppeteer.launch({
			args: [
				'--disable-setuid-sandbox',
				'--no-sandbox',
				'--single-process',
				'--no-zygote'
			],
			executablePath:
				process.env.NODE_ENV === 'production' ?
					process.env.PUPPETEER_EXECUTABLE_PATH :
					executablePath()
		})

		page = await browser.newPage()

		// Set a custom viewport size
		await page.setViewport({ width: 1024, height: 768 })

		await page.goto(url, { waitUntil: 'networkidle0' })
		const snap = await page.screenshot()
		cache[url] = snap
		response.set('Content-Type', 'image/jpeg')
		response.send(snap)
	} catch (error) {
		if (error.message === 'Protocol error (Page.navigate): Cannot navigate to invalid URL')
			return response.status(404).end()
		console.log(error)
		response
			.status(500)
			.json({ error: 'An error occurred while capturing the screenshot' })
	} finally {
		await page.close()
		await browser.close()
	}
})

app.get('/pdf', async (request, response) => {
	let browser = null
	let page = null
	try {
		if (request.method !== 'GET') return response.status(405).end()
		let url = decodeURIComponent(request.query.url)
		// Check if the pdf is already cached
		if (cache[url]) {
			console.log('Serving from cache:', url)
			response.set('Content-Type', 'application/pdf')
			response.send(cache[url])
			return
		}

		// Prepend "http://" if the URL doesn't start with a protocol
		if (!(/^https?:\/\//i).test(url)) {
			url = `http://` + url
		}

		// Strip leading slash from request path
		// const url = request.url.replace(/^\/+/, '')

		browser = await puppeteer.launch({
			args: [
				'--disable-setuid-sandbox',
				'--no-sandbox',
				'--single-process',
				'--no-zygote'
			],
			executablePath:
				process.env.NODE_ENV === 'production' ?
					process.env.PUPPETEER_EXECUTABLE_PATH :
					executablePath()
		})

		page = await browser.newPage()

		// Block favicon.ico requests from reaching puppeteer
		if (url === 'favicon.ico') return response.status(404).end()
		await page.goto(url, { waitUntil: 'networkidle0' })
		console.log(`Converting: ` + url)
		const pdfBuffer = await page.pdf({ format: 'A4' })
		cache[url] = pdfBuffer

		if (!pdfBuffer) return response.status(400).send('Error: Could not generate PDF')

		// Instruct browser to cache PDF for maxAge ms
		if (process.env.NODE_ENV !== 'development') response.setHeader('Cache-control', `public, max-age=1000`)
		// Set Content type to PDF and send the PDF to the client
		response.setHeader('Content-type', 'application/pdf')
		response.send(pdfBuffer)

	} catch (error) {
		if (error.message === 'Protocol error (Page.navigate): Cannot navigate to invalid URL')
			return response.status(404).end()

		console.error(error)
		response.status(500).send('Error: Please try again.')
	} finally {
		await page.close()
		await browser.close()
	}
})

app.listen(port, () => {
	console.log('Snapper is listening on port ' + port)
})
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import * as puppeteer from 'puppeteer';

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

// Set global options for all functions
setGlobalOptions({
  memory: '1GiB',
  timeoutSeconds: 60,
  region: 'us-central1'
});

const url =
  process.env?.NODE_ENV === 'production' ?
    `https://${process.env?.GCLOUD_PROJECT}.web.app/export` :
    'http://localhost:5173/export';

export const exportPDF = onRequest(async (request, response) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: 'networkidle0',
    });
    await page.evaluate((value) => {
      localStorage.clear();
      localStorage.setItem('resume-data', JSON.stringify(value));
    }, request.body);

    await page.reload({
      waitUntil: 'networkidle0',
    });

    const pdf = await page.pdf({
      printBackground: true,
      format: 'letter',
      margin: {
        top: '0',
        bottom: '0',
        left: '0',
        right: '0',
      },
    });

    await browser.close();

    response.contentType('application/pdf');
    response.status(200).send(pdf);
  } catch (e) {
    response.status(500).json({ message: 'Error generating PDF' });
  }
});

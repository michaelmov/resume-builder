import { Request, Response, runWith } from 'firebase-functions';
import * as puppeteer from 'puppeteer';

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

const url =
  process.env?.NODE_ENV === 'production'
    ? 'https://resume-builder-dev-e1417.web.app/export'
    : 'http://localhost:3000/export';

export const exportPDF = runWith({
  memory: '1GB',
  timeoutSeconds: 60,
}).https.onRequest(async (request: Request, response: Response) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: 'networkidle0',
    });

    await page.evaluate((value) => {
      window.localStorage.clear();
      window.localStorage.setItem('resume-data', JSON.stringify(value));
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

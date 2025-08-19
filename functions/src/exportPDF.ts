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
  let browser: puppeteer.Browser | null = null;
  
  try {
    // Configure CORS headers
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    // Validate request method
    if (request.method !== 'POST') {
      response.status(405).json({ message: 'Method not allowed' });
      return;
    }

    // Validate request body
    if (!request.body) {
      response.status(400).json({ message: 'Request body is required' });
      return;
    }

    console.log('Starting PDF generation...');
    
    // Launch browser with better configuration
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2
    });

    console.log('Navigating to:', url);
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('Setting resume data in localStorage...');
    await page.evaluate((resumeData) => {
      localStorage.clear();
      localStorage.setItem('resume-data', JSON.stringify(resumeData));
      console.log('Resume data set:', resumeData);
    }, request.body);

    console.log('Reloading page with resume data...');
    await page.reload({
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait a bit more for React to fully render
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Generating PDF...');
    const pdf = await page.pdf({
      format: 'letter',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
        right: '0.5in',
      },
      displayHeaderFooter: false,
    });

    await browser.close();
    browser = null;

    console.log('PDF generated successfully, size:', pdf.length, 'bytes');

    // Set proper headers for PDF download
    response.set('Content-Type', 'application/pdf');
    response.set('Content-Length', pdf.length.toString());
    response.set('Content-Disposition', 'attachment; filename="resume.pdf"');
    response.status(200).end(pdf);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Clean up browser if it was created
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    response.status(500).json({ 
      message: 'Error generating PDF',
      error: error instanceof Error
        ? error.message
        : 'Unknown error'
    });
  }
});

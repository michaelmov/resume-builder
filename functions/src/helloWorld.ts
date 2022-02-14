import { https, logger, Request, Response } from 'firebase-functions';

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = https.onRequest(
  (request: Request, response: Response) => {
    logger.info('Hello logs!', { structuredData: true });
    response.status(200).json({ greeting: 'Hello world!!!!' });
  }
);

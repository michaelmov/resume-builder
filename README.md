# Developer Resume Builder
---
[Live](https://resume-builder-dev-e1417.web.app/)

A free and open source resume builder made for developers. You can quickly put together a simple resume using clean templates and export as a PDF. 

### Highlights
- PDF export vectorized and ATS compatible.
- You own your data. All data is stored an local storage of your browser and can be exported and imported.
- Uses [JSON Resume](https://jsonresume.org/) standard, so you can import an existing resume.

### Local Development
Simply clone this repo, run `npm install` followed by `npm run dev` to start a local Vite server.

#### PDF Export
This application uses serverless [firebase cloud functions](https://firebase.google.com/docs/functions) to export a pdf and can hosted on [Firebase](https://firebase.google.com/). 

To get cloud functions working locally follow these steps:
1. Create a firebase project.
2. Install [Firebase CLI](https://firebase.google.com/docs/cli).
3. Run `firebase init` at the root and make sure to enable "Cloud functions" and "Hosting" services.
4. Run `firebase init emulators` and make sure to enable the "Functions" emulator
5. Run `cd functions && npm run serve` to compile, build serverless cloud functions and start the local emulator.
import { defineConfig } from 'cypress';

// npm run e2e: builds the e2e configuration, starts scripts/serve-e2e.mjs
// (dev API + the build) and runs these specs in order against it. The API
// is in-memory, so each run starts from the sample stores.
export default defineConfig( {
  e2e: {
    baseUrl: 'http://localhost:4311',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    chromeWebSecurity: false,
    video: false,
    defaultCommandTimeout: 10000,
    viewportWidth: 1280,
    viewportHeight: 900,
  },
} );

import packageJson from '../../package.json';

export const environment = {
  production: false,
  PLATFORM_URL: 'https://market.taliferro.tech',
  /** Same origin: firebase.json rewrites /api/** to the marketApi function (proxy.conf.json in dev). */
  apiBase: '/api',
  VERSION: String( packageJson.version || '' ),
  /** Replace with the live publishable key before launch (Stripe Dashboard → Developers → API keys). */
  /** E2E only (environment.e2e.ts, the Cypress build): sign in as this uid against market/dev/server.js. Always empty in real builds. */
  devAuthUid: 'merchant1',
  /** A stand-in Stripe.js is served by Cypress (cypress/support/fake-stripe.js); never a real key. */
  stripePublishableKey: 'pk_test_e2e_fake',
  firebaseConfig: {
    apiKey: 'AIzaSyApZSnHn8Pd2fI_0oSod0Sv9O_JsOoniBc',
    authDomain: 'taliferrotech.firebaseapp.com',
    projectId: 'taliferrotech',
    storageBucket: 'taliferrotech.appspot.com',
    messagingSenderId: '633736143723',
    appId: '1:633736143723:web:1f91a0cc7efcdc9b5fe22e',
    measurementId: 'G-4QZ1CSSGYJ',
  },
};

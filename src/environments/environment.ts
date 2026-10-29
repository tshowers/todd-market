import packageJson from '../../package.json';

export const environment = {
  production: false,
  PLATFORM_URL: 'https://market.taliferro.tech',
  /** Same origin: firebase.json rewrites /api/** to the marketApi function (proxy.conf.json in dev). */
  apiBase: '/api',
  VERSION: String( packageJson.version || '' ),
  /** Replace with the live publishable key before launch (Stripe Dashboard → Developers → API keys). */
  /** Dev only (environment.devauth.ts): sign in as this uid against market/dev/server.js. Always empty in real builds. */
  devAuthUid: '',
  stripePublishableKey: 'pk_test_REPLACE_ME',
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

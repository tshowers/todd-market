import packageJson from '../../package.json';

export const environment = {
  production: true,
  PLATFORM_URL: 'https://market.taliferro.tech',
  /** Same origin: firebase.json rewrites /api/** to the marketApi function (proxy.conf.json in dev). */
  apiBase: '/api',
  VERSION: String( packageJson.version || '' ),
  /** Taliferro Tech platform account (acct_1Lcw5wDNMbtry5hW). Dev builds keep a placeholder: they run against the fake Stripe. */
  /** Dev only (environment.devauth.ts): sign in as this uid against market/dev/server.js. Always empty in real builds. */
  devAuthUid: '',
  stripePublishableKey: 'pk_live_51Lcw5wDNMbtry5hWTRFBeBWYfW1XMz701tXdYOoUrgwm42YnQs0x2cSv8VFTMm33IIpiS787o6knKAihfZXO4xQl00sVyXvbUz',
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

// The app's own async errors shouldn't fail a test; assertions decide.
Cypress.on( 'uncaught:exception', () => false );

beforeEach( () => {
  // Stripe.js is replaced with a stand-in (the dev API's Stripe is fake too).
  cy.intercept( 'GET', 'https://js.stripe.com/**', { fixture: 'fake-stripe.txt', headers: { 'content-type': 'application/javascript' } } );
} );

// A new merchant (the dev sign-in, "merchant1") opens a store: import a
// catalog → brand → AI build → review → Stripe (fake) → live.
const CSV = [
  'title,price,size,category,image,stock',
  'Linen shirt,64,S,Shirts,https://picsum.photos/seed/shirt/400,5',
  'Linen shirt,64,M,Shirts,https://picsum.photos/seed/shirt/400,5',
  'Linen shirt,64,L,Shirts,https://picsum.photos/seed/shirt/400,5',
  'Wool throw,120,,Home,https://picsum.photos/seed/throw/400,3',
  'Ceramic mug,28,,Home,https://picsum.photos/seed/mug/400,10',
].join( '\n' );

describe( 'Merchant: open a store', () => {
  it( 'imports a CSV, builds the store, gets paid and goes live', () => {
    cy.visit( '/app/onboarding/import' );
    cy.contains( 'button', 'CSV file' ).click();
    cy.get( 'input[type=file][accept*=csv]' ).selectFile( { contents: Cypress.Buffer.from( CSV ), fileName: 'catalog.csv', mimeType: 'text/csv' }, { force: true } );
    cy.contains( '3 products found' );
    cy.get( 'input[placeholder="Betty\'s Bridal"]' ).clear().type( 'Linen & Loom' );
    cy.contains( 'button', 'Next: your brand' ).should( 'not.be.disabled' ).click();

    cy.location( 'pathname' ).should( 'eq', '/app/onboarding/brand' );
    cy.contains( 'button', 'Build my store' ).click();

    // The dev API runs the build job; the Build screen moves on to Review by itself.
    cy.location( 'pathname', { timeout: 30000 } ).should( 'eq', '/app/onboarding/review' );
    cy.contains( 'Your store is ready to review.' );
    cy.contains( 'button', 'Next: get paid' ).click();

    cy.location( 'pathname' ).should( 'eq', '/app/onboarding/get-paid' );
    cy.contains( 'button', 'Continue with Stripe' ).click();
    // Fake Stripe sends us straight back, verified.
    cy.location( 'search', { timeout: 15000 } ).should( 'contain', 'stripe=return' );
    cy.contains( 'button', 'Go live', { timeout: 15000 } ).should( 'not.be.disabled' ).click();

    cy.location( 'pathname' ).should( 'eq', '/app/onboarding/live' );
    cy.contains( 'a', 'View storefront' ).should( 'have.attr', 'href', '/linen-loom' );
  } );
} );

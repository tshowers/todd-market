// A shopper finds the new store, puts a shirt in the bag and checks out
// (Stripe.js is the stand-in from cypress/fixtures/fake-stripe.js).
const ADDRESS = { name: 'Sam Shopper', phone: '9195550100', line1: '9 Elm St', city: 'Durham', state: 'NC', zip: '27701' };

function findAndBag ( query: string, title: string ): void {
  cy.get( 'input[name=q]' ).clear().type( `${ query }{enter}` );
  cy.contains( 'h3', title, { timeout: 15000 } ).parents( 'article' ).first().within( () => {
    cy.contains( 'button', /Add (look )?to bag/ ).click();
  } );
}

describe( 'Shopper: find and buy', () => {
  it( 'is listed in the store directory and search', () => {
    cy.request( 'POST', '/api/network/search', { query: 'linen shirt', lite: true } ).its( 'body.items' ).should( ( items ) => {
      expect( items.map( ( i: { title: string } ) => i.title ) ).to.include( 'Linen shirt' );
    } );
  } );

  it( 'searches the store, bags a shirt and checks out', () => {
    cy.visit( '/linen-loom' );
    findAndBag( 'linen shirt', 'Linen shirt' );
    cy.get( 'button.bag-pill' ).first().should( 'contain', '1' ).click();
    cy.contains( 'a', 'Check out' ).click();

    cy.location( 'pathname' ).should( 'eq', '/linen-loom/checkout' );
    cy.contains( 'label', 'Full name' ).find( 'input' ).type( ADDRESS.name );
    cy.contains( 'label', 'Phone' ).find( 'input' ).type( ADDRESS.phone );
    cy.contains( 'label', 'Address' ).find( 'input' ).type( ADDRESS.line1 );
    cy.contains( 'label', 'City' ).find( 'input' ).type( ADDRESS.city );
    cy.contains( 'label', 'State' ).find( 'input' ).type( ADDRESS.state );
    cy.contains( 'label', 'ZIP' ).find( 'input' ).type( ADDRESS.zip );

    cy.get( '[data-cy=fake-card]', { timeout: 15000 } ).should( 'exist' );
    cy.get( 'button.pay' ).should( 'not.be.disabled' ).click();

    cy.location( 'pathname', { timeout: 15000 } ).should( 'match', /^\/order\/TM-/ );
    cy.contains( 'Linen shirt' );
  } );

  it( 'works on a phone: search and the bag', () => {
    cy.viewport( 375, 812 );
    cy.visit( '/linen-loom' );
    findAndBag( 'ceramic mug', 'Ceramic mug' );
    // On a phone the bag is in the bottom tab bar (design: Shop · Search · Bag · Account).
    cy.get( 'nav.tabbar' ).contains( 'button', 'Bag · 1' ).click();
    cy.contains( 'a', 'Check out' ).should( 'be.visible' );
    cy.document().then( ( doc ) => expect( doc.documentElement.scrollWidth ).to.be.at.most( 375 ) );
  } );
} );

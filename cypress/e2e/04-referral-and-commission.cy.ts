// The backbone: Linen & Loom doesn't carry dress shoes, so its search hands
// the shopper to Cameron's (another real store in the network); the shopper
// buys there from Linen & Loom's bag, and Linen & Loom earns the referral
// commission (10% of $64 = $6.40), pending until Cameron's return window closes.
const ADDRESS = { name: 'Sam Shopper', phone: '9195550100', line1: '9 Elm St', city: 'Durham', state: 'NC', zip: '27701' };

describe( 'Referral: "we don\'t carry that, but this store does"', () => {
  it( 'refers the shopper to Cameron\'s, who buys there through Linen & Loom', () => {
    cy.visit( '/linen-loom' );
    cy.get( 'input[name=q]' ).type( 'suede block heel{enter}' );
    cy.contains( '.tm-tag', 'Not at Linen & Loom · found in the network', { timeout: 15000 } );
    cy.contains( 'We don\'t make these, so we asked Cameron\'s Dress Shoes' );
    cy.contains( 'article.card', 'Suede block heel' ).within( () => {
      cy.contains( 'From Cameron' );
      cy.contains( 'button', 'Add to bag' ).click();
      cy.contains( 'In your bag' );
    } );

    cy.get( 'button.bag-pill' ).first().click();
    cy.contains( 'Cameron' );
    cy.contains( 'a', 'Check out' ).click();
    cy.contains( 'label', 'Full name' ).find( 'input' ).clear().type( ADDRESS.name );
    cy.contains( 'label', 'Phone' ).find( 'input' ).clear().type( ADDRESS.phone );
    cy.contains( 'label', 'Address' ).find( 'input' ).clear().type( ADDRESS.line1 );
    cy.contains( 'label', 'City' ).find( 'input' ).clear().type( ADDRESS.city );
    cy.contains( 'label', 'State' ).find( 'input' ).clear().type( ADDRESS.state );
    cy.contains( 'label', 'ZIP' ).find( 'input' ).clear().type( ADDRESS.zip );
    cy.get( '[data-cy=fake-card]', { timeout: 15000 } ).should( 'exist' );
    cy.get( 'button.pay' ).should( 'not.be.disabled' ).click();

    cy.location( 'pathname', { timeout: 15000 } ).should( 'match', /^\/order\/TM-/ );
    cy.contains( 'Suede block heel' );
    cy.contains( 'Cameron' );
  } );

  it( 'Linen & Loom\'s dashboard shows the commission it earned', () => {
    cy.visit( '/app/dashboard' );
    cy.contains( 'button', 'Ledger' ).click();
    cy.contains( '.what', 'Suede block heel' ).should( 'contain', 'Sent to Cameron\'s Dress Shoes' )
      .parent().should( 'contain', '$6.40' ).and( 'contain', 'Pending' );
  } );
} );

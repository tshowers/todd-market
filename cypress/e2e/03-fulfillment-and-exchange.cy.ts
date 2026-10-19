// The store ships and delivers; the shopper exchanges the shirt for another
// size; the store receives it and ships the swap.
describe( 'After the sale', () => {
  it( 'the store ships the order and marks it delivered', () => {
    cy.on( 'window:confirm', () => true );
    cy.visit( '/app/orders' );
    cy.contains( 'article.order', 'Linen shirt' ).within( () => {
      cy.contains( 'button', 'Shipped' ).click();
      cy.get( 'input.track' ).type( '1Z999AA10123456784{enter}' ).blur();
      cy.contains( 'button', 'Delivered' ).click();
      cy.contains( 'button.on', 'Delivered' );
    } );
  } );

  it( 'the shopper exchanges the shirt for a medium', () => {
    cy.visit( '/account' );
    cy.contains( 'Linen & Loom' ).click();
    cy.contains( 'a', 'Return an item' ).click();
    cy.contains( 'label.item', 'Linen shirt' ).click();
    cy.contains( 'button', 'Continue' ).click();
    cy.contains( 'button.chip', 'Too small' ).click();
    cy.contains( 'button', 'Continue' ).click();
    cy.contains( 'label.opt', 'Exchange for another size' ).click();
    cy.get( '.swap select' ).select( 'M' );
    cy.contains( 'button', 'Start exchange' ).click();
    cy.contains( 'Exchange started.' );
    cy.contains( 'Linen shirt in M' );
  } );

  it( 'the store receives it and ships the swap', () => {
    cy.visit( '/app/orders' );
    cy.contains( 'button', 'Received · ship M' ).click();
    cy.contains( 'h2', 'Exchanges to ship' ).parent().within( () => {
      cy.get( 'input.track' ).type( '9400111202555842' );
      cy.contains( 'button', 'Mark shipped' ).click();
    } );
    cy.contains( 'h2', 'Exchanges to ship' ).should( 'not.exist' );
  } );
} );

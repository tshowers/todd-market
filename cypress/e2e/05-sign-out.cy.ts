// Signing out ends the session: store pages send you to sign in.
describe( 'Sign out', () => {
  it( 'signs out from the menu, and the merchant app asks to sign in again', () => {
    cy.visit( '/app/dashboard' );
    cy.get( '.platform-menu-trigger' ).first().click();
    cy.contains( 'button', 'Sign out' ).click();
    cy.location( 'pathname' ).should( 'eq', '/' );
    cy.visit( '/app/orders' );
    cy.location( 'pathname' ).should( 'eq', '/sign-in' );
    cy.location( 'search' ).should( 'contain', 'as=merchant' );
  } );
} );

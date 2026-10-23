// A live store adds a product from a supplier spec sheet (a made-up
// Lenovo-style .xlsx in cypress/fixtures), and shoppers can find it.
describe( 'Settings → Products: supplier spec sheets', () => {
  it( 'previews the sheet at the markup, adds it, and the store shows it under Laptops', () => {
    cy.visit( '/app/settings/products' );
    cy.contains( 'strong', 'Add products from a supplier spec sheet' );
    cy.contains( 'label', 'Markup on reseller price' ).find( 'input' ).clear().type( '15' );
    cy.get( 'input[type=file]' ).selectFile( 'cypress/fixtures/Lenovo-Sample Laptop-01-Oct-2026.xlsx', { force: true } );
    cy.contains( '.sheet', 'Sample Laptop, Core i5-1335U, 16GB, 512GB SSD, 14"', { timeout: 15000 } ).within( () => {
      cy.contains( 'Cost $500' );
      cy.contains( '$575' );
      cy.contains( 'part TEST0001US' );
    } );
    cy.contains( 'button', 'Add 1 product to your store' ).click();
    cy.contains( '.sheet .tm-tag', 'Added', { timeout: 15000 } );

    // Again: the same part number updates instead of adding a second one.
    cy.get( 'input[type=file]' ).selectFile( 'cypress/fixtures/Lenovo-Sample Laptop-01-Oct-2026.xlsx', { force: true } );
    cy.contains( '.sheet .tm-tag', 'Updates your listing', { timeout: 15000 } );

    cy.visit( '/linen-loom' );
    cy.contains( '.cat', 'Laptops' ).click();
    cy.contains( 'main.browse .prod', 'Sample Laptop' ).should( 'contain', '$575' );
  } );
} );

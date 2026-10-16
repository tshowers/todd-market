import { policySentence } from './return-policy';

describe( 'policySentence (twin of policy.js)', () => {
  it( 'reads like the design', () => {
    expect( policySentence( { windowDays: 30, shopperPaysShipping: true, requireTags: true, finalSaleCategories: ['Sample sale', 'Custom gowns'] } ) )
      .toBe( 'Returns accepted within 30 days of delivery. Items must be unworn with tags attached. Return shipping is paid by the shopper. Sample sale and Custom gowns are final sale.' );
  } );
  it( 'no returns', () => {
    expect( policySentence( { windowDays: 0 } ) ).toBe( 'All sales are final.' );
  } );
} );

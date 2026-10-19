import { shortStoreName } from './short-store-name';

describe( 'shortStoreName', () => {
  it( 'keeps a possessive first word and otherwise the whole name', () => {
    expect( shortStoreName( "Betty's Bridal" ) ).toBe( "Betty's" );
    expect( shortStoreName( 'Cameron’s Dress Shoes' ) ).toBe( "Cameron's" );
    expect( shortStoreName( 'Linen & Loom' ) ).toBe( 'Linen & Loom' );
    expect( shortStoreName( 'The Shoe Box' ) ).toBe( 'The Shoe Box' );
    expect( shortStoreName( '' ) ).toBe( '' );
  } );
} );

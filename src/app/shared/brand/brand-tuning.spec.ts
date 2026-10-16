import { contrast, tuneBrand } from './brand-tuning';

// Same fixture as todd-backend/functions/market/__tests__/brandTuning.test.js.
describe( 'brand-tuning (twin of the backend)', () => {
  it( "tunes Betty's palette exactly like the server", () => {
    const tuned = tuneBrand( { main: '#c9849a', accent: '#4a2340' } );
    expect( tuned ).toEqual( jasmine.objectContaining( {
      accent: '#b55674', tintLight: '#f6eaee', tintDark: '#391923', tintFgLight: '#763866', tintFgDark: '#d39cae', accentShiftPct: 13,
    } ) );
    expect( tuned.notes[0] ).toBe( 'Your rose is 13% deeper on buttons (#c9849a → #b55674) so white text stays readable.' );
    expect( tuned.notes[1] ).toBe( 'Plum becomes the text on rose tags, and dark mode gets a lighter version of each.' );
  } );

  it( 'reaches 4.5:1 for white, black and bright palettes', () => {
    for ( const palette of [{ main: '#ffffff', accent: '#000000' }, { main: '#ffd92e', accent: '#ff4fa8' }] ) {
      const t = tuneBrand( palette );
      expect( contrast( '#ffffff', t.accent ) ).toBeGreaterThanOrEqual( 4.5 );
      expect( contrast( t.tintFgLight, t.tintLight ) ).toBeGreaterThanOrEqual( 4.5 );
      expect( contrast( t.tintFgDark, t.tintDark ) ).toBeGreaterThanOrEqual( 4.5 );
    }
  } );
} );
